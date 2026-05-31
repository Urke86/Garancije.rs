#!/usr/bin/env node
/**
 * Šalje push obaveštenje closed testerima o novoj verziji (Supabase notify-app-update).
 *
 * Env: SUPABASE_URL, CRON_SECRET
 * Optional: APP_VERSION, APP_BUILD_NUMBER
 *
 * Usage:
 *   node scripts/notify-app-update.mjs
 *   node scripts/notify-app-update.mjs --version 1.0.0 --build 4
 *   node scripts/notify-app-update.mjs --force
 */

const args = process.argv.slice(2);
let version = process.env.APP_VERSION;
let build = process.env.APP_BUILD_NUMBER;
let force = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--version' && args[i + 1]) version = args[++i];
  else if (args[i] === '--build' && args[i + 1]) build = args[++i];
  else if (args[i] === '--force') force = true;
}

const supabaseUrl = process.env.SUPABASE_URL;
const cronSecret = process.env.CRON_SECRET;

if (!supabaseUrl || !cronSecret) {
  console.error('Postavite SUPABASE_URL i CRON_SECRET (isti kao za send-reminders).');
  process.exit(1);
}

const body = {
  ...(version ? { app_version: version } : {}),
  ...(build ? { build_number: build } : {}),
  force,
};

const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/notify-app-update`;

const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-cron-secret': cronSecret,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  data = { raw: text };
}

console.log(JSON.stringify(data, null, 2));

if (!res.ok) {
  process.exit(1);
}
