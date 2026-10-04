/** Runs the web app in portfolio demo mode (mock data, no Supabase) on DEMO_PORT (default 8082). */
import { spawn } from 'node:child_process';

const port = process.env.DEMO_PORT || '8082';
spawn(`npx expo start --web --port ${port} --clear`, {
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_DEMO_MODE: '1' },
}).on('exit', (code) => process.exit(code ?? 0));
