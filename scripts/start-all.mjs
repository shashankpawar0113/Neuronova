import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const services = [
  { name: 'Neuronovai (Backend)', dir: 'Neuronovai', cmd: 'npm', args: ['run', 'dev'], port: 5001, color: '\x1b[36m' },
  { name: 'Auth Portal', dir: 'authpage', cmd: 'npm', args: ['run', 'dev'], port: 5174, color: '\x1b[32m' },
  { name: 'Patient Sanctuary', dir: 'homepage', cmd: 'npm', args: ['run', 'dev'], port: 5175, color: '\x1b[35m' },
  { name: 'NeuroMusic', dir: 'Neuromusic', cmd: 'npm', args: ['run', 'dev'], port: 5177, color: '\x1b[33m' },
  { name: 'NeuroGames', dir: 'Neurogames', cmd: 'npm', args: ['run', 'dev'], port: 5178, color: '\x1b[34m' },
  { name: 'Caregiver Hub', dir: 'caregiverpage', cmd: 'npm', args: ['run', 'dev'], port: 5179, color: '\x1b[31m' },
  { name: 'Health Worker', dir: 'healthworker', cmd: 'npm', args: ['run', 'dev'], port: 5180, color: '\x1b[36m' }
];

console.log('\x1b[1m\x1b[34m====================================================\x1b[0m');
console.log('\x1b[1m\x1b[34m🧠 Starting all NeuroNova Services from:\x1b[0m', rootDir);
console.log('\x1b[1m\x1b[34m====================================================\x1b[0m\n');

const children = [];

for (const s of services) {
  const cwd = path.join(rootDir, s.dir);
  console.log(`${s.color}[${s.name}]\x1b[0m Launching in ${cwd}...`);
  
  const child = spawn(s.cmd, s.args, {
    cwd,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env }
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${s.color}[${s.name}]\x1b[0m ${line}`);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.error(`${s.color}[${s.name} ERR]\x1b[0m ${line}`);
      }
    }
  });

  child.on('close', (code) => {
    console.log(`${s.color}[${s.name}]\x1b[0m Exited with code ${code}`);
  });

  children.push(child);
}

function cleanup() {
  console.log('\n\x1b[33mShutting down all NeuroNova services...\x1b[0m');
  for (const child of children) {
    try {
      child.kill();
    } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Open auth portal after 3 seconds
setTimeout(() => {
  console.log('\n\x1b[1m\x1b[32m🚀 All services active! Opening http://localhost:5174/\x1b[0m\n');
  const startCmd = process.platform === 'win32' ? 'start' : 'open';
  spawn(startCmd, ['http://localhost:5174/'], { shell: true, detached: true, stdio: 'ignore' });
}, 4000);
