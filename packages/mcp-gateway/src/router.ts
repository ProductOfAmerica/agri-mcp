interface Env {
  JOHN_DEERE_MCP: Fetcher;
}

export async function routeToProvider(
  request: Request,
  provider: string,
  env: Env,
): Promise<Response> {
  switch (provider) {
    case 'john-deere':
      return env.JOHN_DEERE_MCP.fetch(request);
    default:
      return new Response(
        JSON.stringify({
          error: {
            message: `Unknown provider: ${provider}`,
            code: 'NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
  }
}

export function extractProvider(pathname: string): string | null {
  const match = pathname.match(/^\/v1\/([a-z-]+)/);
  return match?.[1] ?? null;
}
