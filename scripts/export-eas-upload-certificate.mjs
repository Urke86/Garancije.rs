/**
 * Korak 1: preuzme production Android keystore sa EAS GraphQL API-ja
 * i izveze upload_certificate.pem za Play Console (upload key reset).
 *
 * Pokreni: node scripts/export-eas-upload-certificate.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'android', 'keystores');
const pemPath = path.join(outDir, 'upload_certificate.pem');
const jksPath = path.join(outDir, 'upload-keystore.jks');

const PROJECT_FULL_NAME = '@urke86/garancijers';
const ANDROID_PACKAGE = 'rs.garancije.app';
const EXPECTED_SHA1 = '64:82:0C:25:0F:05:55:4A:72:26:A7:7D:B4:A6:AB:94:01:05:EB:F6';

const QUERY = `
  query ExportAndroidUploadCert($projectFullName: String!, $applicationIdentifier: String!) {
    app {
      byFullName(fullName: $projectFullName) {
        androidAppCredentials(
          filter: { applicationIdentifier: $applicationIdentifier, legacyOnly: false }
        ) {
          androidAppBuildCredentialsList {
            id
            name
            isDefault
            androidKeystore {
              keyAlias
              keystorePassword
              keyPassword
              sha1CertificateFingerprint
              keystore
            }
          }
        }
      }
    }
  }
`;

function loadAuthHeaders() {
  const token = process.env.EXPO_TOKEN;
  if (token) {
    return { authorization: `Bearer ${token}` };
  }

  const statePath = path.join(homedir(), '.expo', 'state.json');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const sessionSecret = state?.auth?.sessionSecret;
  if (!sessionSecret) {
    throw new Error(
      'Nema EXPO_TOKEN ni Expo sesije. Uloguj se: npx eas-cli login'
    );
  }
  return { 'expo-session': sessionSecret };
}

async function fetchAndroidBuildCredentials() {
  const headers = {
    'content-type': 'application/json',
    ...loadAuthHeaders(),
  };

  const res = await fetch('https://api.expo.dev/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: QUERY,
      variables: {
        projectFullName: PROJECT_FULL_NAME,
        applicationIdentifier: ANDROID_PACKAGE,
      },
    }),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('\n'));
  }

  const list =
    json.data?.app?.byFullName?.androidAppCredentials?.[0]
      ?.androidAppBuildCredentialsList ?? [];

  if (!list.length) {
    throw new Error('Nema Android build credentials na EAS-u za ovaj paket.');
  }

  return list;
}

function pickBuildCredentials(list) {
  const withKeystore = list.filter((b) => b.androidKeystore?.keystore);
  if (!withKeystore.length) {
    throw new Error('Nijedan build credentials set nema keystore.');
  }

  const def = withKeystore.find((b) => b.isDefault);
  if (def) return def;

  return withKeystore[0];
}

function formatSha1(hexOrColon) {
  const raw = hexOrColon.replace(/:/g, '').toUpperCase();
  return raw.replace(/(.{2})/g, '$1:').slice(0, -1);
}

function sha1FromPem(pem) {
  const forge = require('node-forge');
  const cert = forge.pki.certificateFromPem(pem);
  const md = forge.md.sha1.create();
  md.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());
  return md
    .digest()
    .toHex()
    .toUpperCase()
    .replace(/(.{2})/g, '$1:')
    .slice(0, -1);
}

function serializeCert(cert) {
  const X509Cert = require('jks-js/lib/certs/X509Cert');
  return new X509Cert().generate(cert.value);
}

function certPemFromKeystore(jksBuffer, ks) {
  const jks = require('jks-js');
  const PKCS12Parser = require('jks-js/lib/keystore/PKCS12Parser');
  const KeyEntry = require('jks-js/lib/keystore/KeyEntry');

  const passwords = [
    ks.keystorePassword,
    ks.keyPassword,
    ks.keystorePassword === ks.keyPassword ? null : undefined,
  ].filter((p, i, arr) => p != null && arr.indexOf(p) === i);

  let lastError;
  for (const password of passwords) {
    try {
      const entries = PKCS12Parser.probe(jksBuffer)
        ? jks.parsePkcs12(jksBuffer, password)
        : jks.parseJks(jksBuffer, password);

      const entry = entries.find((e) => e.alias === ks.keyAlias);
      if (!entry || !(entry instanceof KeyEntry) || !entry.chain?.length) {
        throw new Error(`Alias "${ks.keyAlias}" nije pronađen.`);
      }

      // Play traži upload key certificate (javni deo), ne privatni ključ.
      return serializeCert(entry.chain[0]);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error('Ne mogu da pročitam keystore.');
}

function exportPemFromKeystore(ks) {
  const jksBuffer = Buffer.from(ks.keystore, 'base64');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(jksPath, jksBuffer);

  const pem = certPemFromKeystore(jksBuffer, ks);
  writeFileSync(pemPath, pem, 'utf8');

  const sha1 = sha1FromPem(pem.trim());
  return { sha1, keyAlias: ks.keyAlias };
}

console.log('Preuzimanje Android keystore sa EAS (GraphQL)...\n');

const list = await fetchAndroidBuildCredentials();
const buildCred = pickBuildCredentials(list);
const ks = buildCred.androidKeystore;

console.log(`Build credentials: ${buildCred.name}${buildCred.isDefault ? ' (default)' : ''}`);
console.log(`EAS SHA1:        ${formatSha1(ks.sha1CertificateFingerprint)}`);

const { sha1, keyAlias } = exportPemFromKeystore(ks);

console.log('\nGotovo.');
console.log(`  PEM:     ${pemPath}`);
console.log(`  JKS:     ${jksPath} (lokalna kopija — ne commituj)`);
console.log(`  Alias:   ${keyAlias}`);
console.log(`  SHA1:    ${sha1}`);

const easSha1 = formatSha1(ks.sha1CertificateFingerprint);
if (sha1 !== EXPECTED_SHA1 && easSha1 !== EXPECTED_SHA1) {
  console.warn(
    `\nUpozorenje: SHA1 se ne poklapa sa očekivanim iz poslednjeg AAB (${EXPECTED_SHA1}).`
  );
} else {
  console.log('\nSHA1 se poklapa sa potpisom builda 38af58c2 — ispravan PEM za Play reset.');
}

console.log('\nSledeće: Play Console → App integrity → Request upload key reset → upload PEM.');
