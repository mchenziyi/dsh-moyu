import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const cwd = resolve(import.meta.dirname, '..');
const port = 8790;
const base = `http://127.0.0.1:${port}`;
const child = spawn(resolve(cwd, 'node_modules/.bin/wrangler'), ['dev', '--local', '--port', String(port)], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
let ready = false;

const timer = setTimeout(() => finish(1, 'wrangler dev did not become ready'), 45000);

function finish(code, reason) {
  clearTimeout(timer);
  if (reason !== undefined) console.error(reason);
  try { child.kill('SIGTERM'); } catch { /* gone */ }
  setTimeout(() => {
    try { child.kill('SIGKILL'); } catch { /* gone */ }
    process.exit(code);
  }, 500);
}

child.stdout.on('data', (chunk) => {
  output += String(chunk);
  if (!ready && /Ready on/.test(output)) {
    ready = true;
    const test = spawn(process.execPath, ['test/local.mjs'], {
      cwd,
      stdio: 'inherit',
      env: Object.assign({}, process.env, { WORKER_URL: base }),
    });
    test.on('exit', (code) => finish(code ?? 1));
  }
});
child.stderr.on('data', (chunk) => { output += String(chunk); });
child.on('exit', (code) => {
  if (!ready) finish(1, `wrangler dev exited (${code})\n${output}`);
});
