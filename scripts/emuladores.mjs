// Sobe e derruba o Firebase Emulator Suite. Usado pelos testes de regras e pelos testes ponta a ponta.
// Substitui `firebase emulators:exec`, que no Windows deixa o Java do Firestore rodando e prende a porta.
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';

export const PORTAS = { auth: 9099, firestore: 8181 };
export const PROJETO = 'demo-bairro-alerta';
export const windows = process.platform === 'win32';

function portaLivre(porta) {
  return new Promise((ok) => {
    const s = net.createServer().once('error', () => ok(false)).once('listening', () => s.close(() => ok(true)));
    s.listen(porta, '127.0.0.1');
  });
}

/** Sobe os emuladores pedidos e devolve uma função que derruba a árvore de processos inteira. */
export async function subirEmuladores(servicos) {
  for (const nome of servicos) {
    if (!(await portaLivre(PORTAS[nome]))) {
      throw new Error(
        `Porta ${PORTAS[nome]} (${nome}) ocupada. Provavelmente um emulador antigo ficou rodando. ` +
          (windows ? `Veja com: Get-NetTCPConnection -LocalPort ${PORTAS[nome]} | Select OwningProcess` : `Veja com: lsof -i :${PORTAS[nome]}`),
      );
    }
  }

  const processo = spawn('npx', ['firebase', 'emulators:start', '--only', servicos.join(','), '--project', PROJETO], {
    shell: windows,
    detached: !windows,
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  const derrubar = () => {
    if (processo.exitCode !== null) return;
    if (windows) spawnSync('taskkill', ['/pid', String(processo.pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-processo.pid, 'SIGTERM');
  };
  process.on('exit', derrubar);
  process.on('SIGINT', () => process.exit(130));

  await new Promise((pronto, falhou) => {
    const limite = setTimeout(() => falhou(new Error('Emuladores não subiram em 90 s.')), 90_000);
    processo.stdout.on('data', (trecho) => {
      if (String(trecho).includes('All emulators ready')) {
        clearTimeout(limite);
        pronto();
      }
    });
    processo.once('exit', (codigo) => falhou(new Error(`Emuladores encerraram antes de ficar prontos (código ${codigo}).`)));
  }).catch((erro) => {
    derrubar();
    throw erro;
  });

  return derrubar;
}

export const variaveisEmulador = {
  FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PORTAS.firestore}`,
  FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${PORTAS.auth}`,
};
