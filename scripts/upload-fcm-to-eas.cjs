const fs = require('fs');
const path = require('path');

const EAS_ROOT = path.join(
  process.env.APPDATA || path.join(process.env.HOME, 'AppData', 'Roaming'),
  'npm',
  'node_modules',
  'eas-cli',
);

const { createGraphqlClient } = require(path.join(
  EAS_ROOT,
  'build/commandUtils/context/contextUtils/createGraphqlClient.js',
));
const { AppQuery } = require(path.join(EAS_ROOT, 'build/graphql/queries/AppQuery.js'));
const {
  updateAndroidAppCredentialsAsync,
  createOrGetExistingAndroidAppCredentialsWithBuildCredentialsAsync,
  createGoogleServiceAccountKeyAsync,
} = require(path.join(EAS_ROOT, 'build/credentials/android/api/GraphqlClient.js'));

const projectRoot = path.join(__dirname, '..');
const keyPath = path.join(projectRoot, 'credentials', 'firebase-fcm-v1.json');
const statePath = path.join(process.env.USERPROFILE || process.env.HOME, '.expo', 'state.json');

async function main() {
  if (!fs.existsSync(keyPath)) {
    console.error('Missing credentials/firebase-fcm-v1.json');
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const sessionSecret = state?.auth?.sessionSecret;
  if (!sessionSecret) {
    console.error('Not logged in to EAS. Run: eas login');
    process.exit(1);
  }

  const graphqlClient = createGraphqlClient({ accessToken: null, sessionSecret });
  const app = await AppQuery.byFullNameAsync(graphqlClient, '@urke86/garancijers');
  const appLookup = {
    account: app.ownerAccount,
    projectName: app.slug,
    androidApplicationIdentifier: 'rs.garancije.app',
  };

  const jsonKey = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const gsaKey = await createGoogleServiceAccountKeyAsync(graphqlClient, app.ownerAccount, jsonKey);

  const appCredentials = await createOrGetExistingAndroidAppCredentialsWithBuildCredentialsAsync(
    graphqlClient,
    appLookup,
  );

  await updateAndroidAppCredentialsAsync(graphqlClient, appCredentials, {
    googleServiceAccountKeyForFcmV1Id: gsaKey.id,
  });

  console.log('FCM V1 service account uploaded and assigned to rs.garancije.app');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
