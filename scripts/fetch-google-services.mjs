import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';

const keyPath =
  process.argv[2] ??
  path.join(process.env.USERPROFILE ?? '', 'Downloads', 'snizzy-a518c-firebase-adminsdk-fbsvc-2b145fe496.json');

const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const projectId = key.project_id;

const auth = new GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/firebase.readonly'],
});

const client = await auth.getClient();
const base = `https://firebase.googleapis.com/v1beta1/projects/${projectId}`;

const { data: appsData } = await client.request({ url: `${base}/androidApps` });
const apps = appsData.apps ?? [];

const clients = [];
for (const app of apps) {
  const name = app.name;
  const { data: config } = await client.request({
    url: `https://firebase.googleapis.com/v1beta1/${name}/config`,
  });
  const raw = config.configFileContents;
  const json =
    typeof raw === 'string' && !raw.trimStart().startsWith('{')
      ? Buffer.from(raw, 'base64').toString('utf8')
      : raw;
  clients.push(JSON.parse(json));
}

const merged = {
  project_info: clients[0]?.project_info,
  client: clients.flatMap((c) => c.client ?? []),
  configuration_version: '1',
};

const outPath = path.join(process.cwd(), 'google-services.json');
fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
console.log('Wrote', outPath);
console.log(
  'Packages:',
  merged.client.map((c) => c.client_info.android_client_info.package_name).join(', '),
);
