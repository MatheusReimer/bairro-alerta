// Sobe o Firebase Emulator, roda os testes das regras e derruba os emuladores no final.
// Substitui `firebase emulators:exec`, que no Windows deixa o Java do Firestore rodando e prende a porta.
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';

const PORTAS = { firestore: 8181, storage: 9199 };
const windows = process.platform === 'win32';

function portaLivre(porta) {
  return new Promise((ok) => {
    const s = net.createServer().once('error', () => ok(false)).once('listening', () => s.close(() => ok(true)));
    s.listen(porta, '127.0.0.1');
  });
}

for (const [nome, porta] of Object.entries(PORTAS)) {
  if (!(await portaLivre(porta))) {
    console.error(`Porta ${porta} (${nome}) ocupada. Provavelmente um emulador antigo ficou rodando.`);
    console.error(windows ? `Veja com: Get-NetTCPConnection -LocalPort ${porta} | Select OwningProcess` : `Veja com: lsof -i :${porta}`);
    process.exit(1);
  }
}

const emuladores = spawn('npx', ['firebase', 'emulators:start', '--only', 'firestore,storage', '--project', 'demo-bairro-alerta'], {
  shell: windows,
  detached: !windows,
  stdio: ['ignore', 'pipe', 'inherit'],
});

function derrubar() {
  if (emuladores.exitCode !== null) return;
  if (windows) spawnSync('taskkill', ['/pid', String(emuladores.pid), '/T', '/F'], { stdio: 'ignore' });
  else process.kill(-emuladores.pid, 'SIGTERM');
}
process.on('exit', derrubar);
process.on('SIGINT', () => process.exit(130));

await new Promise((pronto, falhou) => {
  const limite = setTimeout(() => falhou(new Error('Emuladores não subiram em 90 s.')), 90_000);
  emuladores.stdout.on('data', (trecho) => {
    if (String(trecho).includes('All emulators ready')) {
      clearTimeout(limite);
      pronto();
    }
  });
  emuladores.once('exit', (codigo) => falhou(new Error(`Emuladores encerraram antes de ficar prontos (código ${codigo}).`)));
}).catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});

const jest = spawnSync('npx', ['jest', '-c', 'jest.regras.config.js', ...process.argv.slice(2)], {
  shell: windows,
  stdio: 'inherit',
  env: { ...process.env, FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PORTAS.firestore}`, FIREBASE_STORAGE_EMULATOR_HOST: `127.0.0.1:${PORTAS.storage}` },
});
process.exit(jest.status ?? 1);
