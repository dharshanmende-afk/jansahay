import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

function launch(name, args, cwd) {
  const proc = spawn(npmCmd, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin
  });
  proc.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return proc;
}

console.log('Starting JanSahay AI API Server (port 5000) + Vite Client (port 5173)...');
const serverProc = launch('server', ['run', 'dev'], path.join(rootDir, 'server'));
const clientProc = launch('client', ['run', 'dev'], path.join(rootDir, 'client'));

const shutdown = () => {
  serverProc.kill('SIGINT');
  clientProc.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
