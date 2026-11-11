import { mkdirSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

// This command intentionally supports offline catalogue work only.
const files = readdirSync(new URL('../', import.meta.url));
const localConfig = files.filter(name => /^(\.env|\.dev\.vars)/.test(name) && !name.endsWith('.example'));
const configured = Object.keys(process.env).filter(name => /^(SUPABASE_|MYWAY_ADMIN_|NEXT_PUBLIC_)/.test(name) && process.env[name]);
if (localConfig.length || configured.length) {
  console.error('Isolated development refuses local environment files or connected-service settings. Use a clean checkout with no service credentials.');
  process.exit(1);
}
const configDirectory = new URL('../.sites-runtime/isolated-config/', import.meta.url).pathname;
mkdirSync(configDirectory, { recursive: true });
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], {
  cwd: new URL('../', import.meta.url), stdio: 'inherit',
  env: { ...process.env, XDG_CONFIG_HOME: configDirectory, WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: '.wrangler/isolated.log' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
