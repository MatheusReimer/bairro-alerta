// Sobe o Firestore no emulador, roda os testes das regras e derruba tudo no final.
import { spawnSync } from 'node:child_process';

import { subirEmuladores, variaveisEmulador, windows } from './emuladores.mjs';

let derrubar;
try {
  derrubar = await subirEmuladores(['firestore']);
} catch (erro) {
  console.error(erro.message);
  process.exit(1);
}

const jest = spawnSync('npx', ['jest', '-c', 'jest.regras.config.js', ...process.argv.slice(2)], {
  shell: windows,
  stdio: 'inherit',
  env: { ...process.env, ...variaveisEmulador },
});
derrubar();
process.exit(jest.status ?? 1);
