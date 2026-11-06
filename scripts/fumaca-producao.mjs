// Teste de fumaça no projeto real: cadastra uma conta de teste, registra uma ocorrência com foto e GPS
// pelo site publicado, confere a foto no detalhe e apaga tudo no final (conta, ocorrência e foto).
// Uso: node scripts/fumaca-producao.mjs   (requer `npx firebase login` e o .env do projeto real)
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, devices } from '@playwright/test';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const PROJETO = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const CHAVE = env.EXPO_PUBLIC_FIREBASE_API_KEY;
const SITE = `https://${PROJETO}.web.app`;
const EMAIL = `fumaca-${Date.now()}@teste.bairroalerta.dev`;
const SENHA = 'Fumaca-teste-123';
const windows = process.platform === 'win32';

const navegador = await chromium.launch({ channel: windows ? 'chrome' : undefined });
const contexto = await navegador.newContext({
  ...devices['Pixel 7'],
  locale: 'pt-BR',
  geolocation: { latitude: -26.9055, longitude: -49.0943 },
  permissions: ['geolocation'],
});
const page = await contexto.newPage();
let ocorrenciaId;
let falhou = false;

try {
  await page.goto(`${SITE}/cadastro`);
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByRole('heading', { name: 'Ocorrências do bairro' }).waitFor();
  console.log('ok  cadastro e login');

  await page.getByRole('button', { name: 'Registrar problema' }).click();
  const [seletor] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Tirar foto' }).click()]);
  await seletor.setFiles(join('e2e', 'fixtures', 'buraco-com-gps.jpg'));
  await page.getByRole('button', { name: 'Alagamento', exact: true }).click();
  await page.getByText('Local marcado pelo GPS').waitFor();
  await page.getByLabel('Descrição (opcional)').fill('Teste de fumaça (apagado automaticamente)');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await page.getByText('Ocorrência registrada. Obrigado!').waitFor();
  console.log('ok  registro com foto e GPS');

  await page.getByRole('button', { name: /Teste de fumaça/ }).click();
  await page.waitForURL(/\/ocorrencia\//);
  ocorrenciaId = page.url().split('/ocorrencia/')[1];
  const foto = page.getByLabel('Foto do problema').last();
  await foto.waitFor();
  await page.waitForFunction(() => [...document.images].some((i) => i.src.startsWith('data:image/jpeg') && i.naturalWidth > 0));
  console.log('ok  foto carregada do Firestore no detalhe');
  await page.screenshot({ path: join('docs', 'capturas', '08-producao-detalhe.png') });
} catch (erro) {
  falhou = true;
  console.error('FALHOU:', erro.message);
  await page.screenshot({ path: join('docs', 'capturas', 'fumaca-falha.png') }).catch(() => {});
} finally {
  await navegador.close();
}

// Limpeza: apaga a ocorrência e a foto (pela CLI do Firebase) e a conta de teste (pela API do Auth).
const login = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${CHAVE}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: SENHA, returnSecureToken: true }),
}).then((r) => r.json());

if (ocorrenciaId && login.idToken) {
  const doc = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents/ocorrencias/${ocorrenciaId}`,
    { headers: { Authorization: `Bearer ${login.idToken}` } },
  ).then((r) => r.json());
  const caminhos = [`ocorrencias/${ocorrenciaId}`, doc.fields?.fotoPath?.stringValue].filter(Boolean);
  for (const caminho of caminhos) {
    const r = spawnSync('npx', ['firebase', 'firestore:delete', caminho, '--force', '--project', PROJETO], { shell: windows });
    console.log(r.status === 0 ? `ok  apagado ${caminho}` : `ERRO ao apagar ${caminho}`);
  }
}
if (login.idToken) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${CHAVE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: login.idToken }),
  });
  console.log(r.ok ? 'ok  conta de teste apagada' : 'ERRO ao apagar a conta de teste');
}
process.exit(falhou ? 1 : 0);
