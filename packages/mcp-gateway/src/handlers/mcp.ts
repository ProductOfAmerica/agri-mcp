import type { MonthlyUsageCounter } from '../durable-objects/monthly-counter.js';
import { ApiError, Errors } from '../lib/errors.js';
import type { Env } from '../lib/types.js';
import {
  extractToolName,
  parseJsonBody,
  sanitizeObject,
  validateFarmerId,
  validateJsonDepth,
} from '../lib/validation.js';
import { extractApiKey, validateApiKey } from '../services/auth.js';
import {
  checkAuthRateLimit,
  checkRateLimit,
  recordAuthFailure,
} from '../services/rate-limit.js';
import {
  getFarmerConnections,
  type Provider,
  routeToProvider,
} from '../services/router.js';
import { logUsage } from '../services/usage.js';

export interface GatewayEnv extends Env {
  MONTHLY_COUNTER: DurableObjectNamespace<MonthlyUsageCounter>;
}

export async function handleMcpRequest(
  request: Request,
  env: GatewayEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  const startTime = Date.now();

  const apiKey = extractApiKey(request);
  const authRateLimitKey = apiKey ? apiKey.slice(0, 14) : 'unknown';

  const authRateLimit = await checkAuthRateLimit(authRateLimitKey, env);
  if (!authRateLimit.allowed) {
    throw new ApiError(
      429,
      'Too many failed authentication attempts. Try again later.',
      'AUTH_RATE_LIMITED',
    );
  }

  const validation = await validateApiKey(apiKey, env);

  if (
    !validation.valid ||
    !validation.developer ||
    !validation.subscription ||
    !validation.keyId
  ) {
    ctx.waitUntil(recordAuthFailure(authRateLimitKey, env));
    throw Errors.unauthorized();
  }

  const { developer, subscription, keyId } = validation;

  const farmerId = request.headers.get('X-Farmer-ID');
  validateFarmerId(farmerId);

  const connectedProviders = await getFarmerConnections(
    developer.id,
    farmerId!,
    env,
  );

  if (connectedProviders.length === 0) {
    throw new ApiError(
      400,
      'No providers connected for this farmer. Connect a provider in the dashboard first.',
      'NO_PROVIDERS',
    );
  }

  const counterStub = env.MONTHLY_COUNTER.get(
    env.MONTHLY_COUNTER.idFromName(developer.id),
  );
  const monthlyLimit = await counterStub.checkAndIncrement(
    developer.id,
    subscription.monthly_request_limit,
  );

  if (!monthlyLimit.allowed) {
    throw Errors.rateLimited(monthlyLimit.resetAt);
  }

  const rateLimit = await checkRateLimit(developer.id, subscription.tier, env);

  if (!rateLimit.allowed) {
    await counterStub.decrement(developer.id);
    throw Errors.rateLimited(rateLimit.resetAt);
  }

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (e) {
    await counterStub.decrement(developer.id);
    throw e;
  }

  try {
    validateJsonDepth(body);
  } catch (e) {
    await counterStub.decrement(developer.id);
    throw e;
  }

  const sanitizedBody = sanitizeObject(body) as {
    method?: string;
    params?: { arguments?: { provider?: Provider } };
  };
  const toolName = extractToolName(sanitizedBody);

  const requestedProvider = sanitizedBody.params?.arguments?.provider;
  let provider: Provider;

  if (requestedProvider) {
    if (!connectedProviders.includes(requestedProvider)) {
      throw new ApiError(
        400,
        `Provider '${requestedProvider}' is not connected for this farmer`,
        'PROVIDER_NOT_CONNECTED',
      );
    }
    provider = requestedProvider;
  } else if (connectedProviders.length === 1) {
    provider = connectedProviders[0]!;
  } else {
    throw new ApiError(
      400,
      `Multiple providers connected. Specify 'provider' in arguments: ${connectedProviders.join(', ')}`,
      'AMBIGUOUS_PROVIDER',
    );
  }

  const modifiedRequest = new Request(request.url, {
    method: 'POST',
    headers: new Headers(request.headers),
    body: JSON.stringify(sanitizedBody),
  });
  modifiedRequest.headers.set('X-Developer-ID', developer.id);
  modifiedRequest.headers.set('X-API-Key-ID', keyId);
  modifiedRequest.headers.set('X-Tier', subscription.tier);

  let response: Response;
  let statusCode: number;
  try {
    response = await routeToProvider(modifiedRequest, provider, env);
    statusCode = response.status;
  } catch (e) {
    console.error('[error] provider:', e);
    response = Errors.internal().toResponse();
    statusCode = 500;
  }

  const responseTime = Date.now() - startTime;

  await logUsage(
    {
      developerId: developer.id,
      apiKeyId: keyId,
      provider,
      toolName,
      responseTimeMs: responseTime,
      statusCode,
    },
    env,
  );

  const modifiedResponse = new Response(response.body, response);
  modifiedResponse.headers.set(
    'X-RateLimit-Remaining',
    String(rateLimit.remaining),
  );

  return modifiedResponse;
}
