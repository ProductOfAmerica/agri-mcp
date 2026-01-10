#!/usr/bin/env node

import {
  attachFilteredOutputHandlers,
  colors,
  DASHBOARD_DIR,
  initializeEnvironment,
  log,
  setupCleanup,
  shellSpawn,
  spawnWithPrefix,
  startSupabase,
  startSupabaseFunctions,
} from './lib/utils.js';

/**
 * Builds Next.js for production asynchronously.
 * Returns a Promise that resolves when the build completes.
 */
function buildNext() {
  log('NEXT', colors.blue, 'Building Next.js for production...');

  return new Promise((resolve, reject) => {
    const proc = shellSpawn('pnpm', ['build'], {
      cwd: DASHBOARD_DIR,
      stdio: 'pipe',
    });

    attachFilteredOutputHandlers(proc, 'NEXT', colors.blue);

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn Next.js build: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Next.js build failed with code ${code}`));
        return;
      }
      log('NEXT', colors.blue, 'Build complete!');
      resolve();
    });
  });
}

function startNextProd() {
  log('NEXT', colors.blue, 'Starting Next.js production server...');
  return spawnWithPrefix('pnpm', ['start'], DASHBOARD_DIR, 'NEXT', colors.blue);
}

async function main() {
  console.log('\n🌾 FieldMCP Local Production Environment\n');

  const { stripeProc } = await initializeEnvironment();

  // Run Supabase start and Next.js build in PARALLEL
  const [supabaseCreds] = await Promise.all([startSupabase(), buildNext()]);

  // Start the services now that both Supabase and build are ready
  const functionsProc = startSupabaseFunctions();
  const nextProc = startNextProd();

  // Clean summary
  console.log('');
  console.log(
    `${colors.green}✓${colors.reset} All services ready (production mode)`,
  );
  console.log(
    `  Dashboard:  ${colors.cyan}http://localhost:3000${colors.reset}`,
  );
  console.log(
    `  Gateway:    ${colors.cyan}http://127.0.0.1:54321/functions/v1/mcp-gateway${colors.reset}`,
  );
  console.log(
    `  Studio:     ${colors.cyan}${supabaseCreds.studioUrl}${colors.reset}`,
  );
  console.log('');

  setupCleanup([nextProc, functionsProc, stripeProc]);
}

main().catch((err) => {
  log('ERROR', colors.red, err.message);
  process.exit(1);
});
