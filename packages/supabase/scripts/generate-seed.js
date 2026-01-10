#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

// Try to load .env.local if dotenv is available
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch {
  // dotenv not installed, rely on environment variables
}

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'seed.sql.template',
);
const OUTPUT_PATH = path.join(__dirname, '..', 'supabase', 'seed.sql');

// Read template
let template;
try {
  template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
} catch (err) {
  console.error(`Error: Could not read template file at ${TEMPLATE_PATH}`);
  console.error(err.message);
  process.exit(1);
}

// Find and replace all ${VAR_NAME} patterns
const replaced = [];
const missing = [];
const result = template.replace(
  /\$\{([A-Z_][A-Z0-9_]*)\}/g,
  (match, varName) => {
    const value = process.env[varName];
    if (value !== undefined) {
      replaced.push(varName);
      return value;
    }
    missing.push(varName);
    return match; // Keep placeholder if missing
  },
);

// Log results
for (const v of replaced) console.log(`Replaced: ${v}`);
for (const v of missing) console.warn(`Missing: ${v}`);
console.log(
  `\nGenerated seed.sql (${replaced.length}/${replaced.length + missing.length} variables)`,
);

// Write output
try {
  fs.writeFileSync(OUTPUT_PATH, result);
} catch (err) {
  console.error(`Error: Could not write to ${OUTPUT_PATH}`);
  console.error(err.message);
  process.exit(1);
}

// Exit with error if missing variables
if (missing.length > 0) {
  console.error('\nError: Missing environment variables');
  process.exit(1);
}
