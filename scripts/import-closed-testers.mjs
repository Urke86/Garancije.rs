#!/usr/bin/env node
/**
 * Uvozi emailove closed testera u Supabase (tabela closed_testers).
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Usage: node scripts/import-closed-testers.mjs [putanja-do-fajla]
 *        Default: scripts/closed-testers.txt (kreirajte iz .example)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const filePath = resolve(root, process.argv[2] || 'scripts/closed-testers.txt');

if (!url || !key) {
  console.error('Postavite SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (!existsSync(filePath)) {
  console.error(`Fajl ne postoji: ${filePath}`);
  console.error('Kopirajte scripts/closed-testers.example.txt → scripts/closed-testers.txt');
  process.exit(1);
}

const emails = [
  ...new Set(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#')),
  ),
];

if (emails.length === 0) {
  console.error('Nema emailova u fajlu.');
  process.exit(1);
}

const rows = emails.map((email) => ({ email: email.toLowerCase() }));

const res = await fetch(`${url}/rest/v1/closed_testers?on_conflict=email`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
});

if (!res.ok) {
  console.error('Import failed:', res.status, await res.text());
  process.exit(1);
}

console.log(`Uvezeno ${emails.length} closed tester email(ova).`);
