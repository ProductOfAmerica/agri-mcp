#!/usr/bin/env node

import {
  colors,
  DASHBOARD_DIR,
  initializeEnvironment,
  log,
  logInfo,
  setupCleanup,
  spawnWithPrefix,
  startSupabase,
  startSupabaseFunctions,
} from './lib/utils.js';

function startNextDev() {
  log('NEXT', colors.blue, 'Starting Next.js dev server...');
  return spawnWithPrefix('pnpm', ['dev'], DASHBOARD_DIR, 'NEXT', colors.blue);
}

async function main() {
  console.log('\n🌾 FieldMCP Development Environment\n');

  const { stripeProc } = await initializeEnvironment();

  // Start Next.js dev server immediately (can compile while Supabase starts)
  logInfo('Starting Next.js and Supabase in parallel...');
  const nextProc = startNextDev();

  // Start Supabase (Edge Functions need to wait for this)
  const supabaseCreds = await startSupabase();

  // Start Edge Functions (after Supabase is ready)
  const functionsProc = startSupabaseFunctions();

  // Clean summary
  console.log('');
  console.log(`${colors.green}✓${colors.reset} All services ready`);
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
