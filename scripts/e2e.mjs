// Testes ponta a ponta: gera o build web apontando para os emuladores, sobe Auth/Firestore/Storage,
// roda o Playwright (que serve o build) e derruba tudo no final.
// Uso: npm run e2e            (com build)
//      npm run e2e -- --sem-build [argumentos do playwright]
import { spawnSync } from 'node:child_process';

import { subirEmuladores, variaveisEmulador, windows } from './emuladores.mjs';

const args = process.argv.slice(2);
const semBuild = args.includes('--sem-build');
const argsPlaywright = args.filter((a) => a !== '--sem-build');

function rodar(comando, parametros, env = {}) {
  return spawnSync(comando, parametros, { shell: windows, stdio: 'inherit', env: { ...process.env, ...env } }).status ?? 1;
}

if (!semBuild) {
  const status = rodar('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist-e2e', '--clear'], {
    EXPO_PUBLIC_USE_EMULATORS: '1',
  });
  if (status !== 0) process.exit(status);
}

let derrubar;
try {
  derrubar = await subirEmuladores(['auth', 'firestore', 'storage']);
} catch (erro) {
  console.error(erro.message);
  process.exit(1);
}

const status = rodar('npx', ['playwright', 'test', ...argsPlaywright], variaveisEmulador);
derrubar();
process.exit(status);
