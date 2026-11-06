import { expect, test, type Browser, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { baixarFoto, criarModerador, lerOcorrencias, limparEmuladores } from './emulador';

const FOTO = join(__dirname, 'fixtures', 'buraco-com-gps.jpg');
const CAPTURAS = join(__dirname, '..', 'docs', 'capturas');
const SENHA = 'senha-forte-123';

async function capturar(page: Page, nome: string) {
  await page.screenshot({ path: join(CAPTURAS, `${nome}.png`) });
}

async function cadastrar(page: Page, email: string) {
  await page.goto('/cadastro');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Ocorrências do bairro' })).toBeVisible();
}

async function entrar(page: Page, email: string) {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Ocorrências do bairro' })).toBeVisible();
}

async function preencherOcorrencia(page: Page, categoria: string, descricao: string) {
  await page.getByRole('button', { name: 'Registrar problema' }).click();
  const [seletor] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Tirar foto' }).click()]);
  await seletor.setFiles(FOTO);
  await expect(page.getByLabel('Foto do problema')).toBeVisible();
  await page.getByRole('button', { name: categoria, exact: true }).click();
  await expect(page.getByText('Local marcado pelo GPS')).toBeVisible();
  await page.getByLabel('Descrição (opcional)').fill(descricao);
}

async function novaPagina(browser: Browser) {
  const contexto = await browser.newContext(test.info().project.use);
  return contexto.newPage();
}

test.beforeEach(async () => {
  await limparEmuladores();
});

test('T-03-04 cadastro, saída e novo login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await capturar(page, '01-entrar');

  await cadastrar(page, 'maria@exemplo.com');
  await expect(page.getByText('Nenhuma ocorrência por aqui ainda.')).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();

  await page.getByLabel('E-mail').fill('maria@exemplo.com');
  await page.getByLabel('Senha').fill('senha-errada-1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible();

  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Ocorrências do bairro' })).toBeVisible();

  // A sessão continua depois de recarregar a página.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ocorrências do bairro' })).toBeVisible();
});

test('T-04-10 registro com foto real: aparece na lista e a foto é salva sem o GPS do EXIF', async ({ page }) => {
  const original = readFileSync(FOTO);
  expect(original.includes(Buffer.from('Exif'))).toBe(true); // a foto de teste tem GPS

  await cadastrar(page, 'maria@exemplo.com');
  await preencherOcorrencia(page, 'Alagamento', 'Esquina da escola alaga com qualquer chuva');
  await capturar(page, '02-nova-ocorrencia');
  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(page.getByText('Ocorrência registrada. Obrigado!')).toBeVisible();
  await expect(page.getByRole('button', { name: /Esquina da escola alaga com qualquer chuva/ })).toBeVisible();
  await capturar(page, '03-lista');

  const [salva] = await lerOcorrencias();
  expect(salva.campos.status.stringValue).toBe('aberta');
  expect(Object.keys(salva.campos)).not.toContain('email');
  const foto = await baixarFoto(salva.campos.fotoPath.stringValue!);
  expect(foto.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8])); // é um JPEG
  expect(foto.includes(Buffer.from('Exif'))).toBe(false);

  await page.getByRole('button', { name: /Esquina da escola alaga com qualquer chuva/ }).click();
  await expect(page.getByRole('heading', { name: 'Alagamento' })).toBeVisible();
  await expect(page.getByText('Você registrou esta ocorrência')).toBeVisible();
  await expect(page.getByText('maria@exemplo.com')).toHaveCount(0); // T-04-08
  await capturar(page, '04-detalhe');
});

test('fluxo do bairro: vizinho apoia pela sugestão, moderação encaminha e oculta, autora é avisada', async ({ page, browser }) => {
  await criarModerador('associacao@vilanova.org', SENHA);

  // Maria registra o buraco.
  await cadastrar(page, 'maria@exemplo.com');
  await preencherOcorrencia(page, 'Alagamento', 'Alagamento na Rua Hermann Hering');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Ocorrência registrada. Obrigado!')).toBeVisible();

  // José, no mesmo lugar, tenta registrar o mesmo problema e recebe a sugestão (T-06-05).
  const jose = await novaPagina(browser);
  await cadastrar(jose, 'jose@exemplo.com');
  await preencherOcorrencia(jose, 'Alagamento', 'Rua alagada de novo');
  await jose.getByRole('button', { name: 'Enviar' }).click();
  await expect(jose.getByRole('heading', { name: 'Já existe um registro parecido aqui' })).toBeVisible();
  await capturar(jose, '05-sugestao-semelhante');
  await jose.getByRole('button', { name: 'Apoiar esta' }).click();
  await expect(jose.getByText('Você apoiou esta ocorrência')).toBeVisible();
  const [unica, ...outras] = await lerOcorrencias();
  expect(outras).toHaveLength(0); // não duplicou
  expect(unica.campos.apoios.integerValue).toBe('1');

  // A moderação encaminha à prefeitura (T-08-01) e depois oculta (T-08-06).
  const moderacao = await novaPagina(browser);
  await entrar(moderacao, 'associacao@vilanova.org');
  await expect(moderacao.getByText('Moderação da associação')).toBeVisible();
  await moderacao.getByRole('button', { name: /Alagamento na Rua Hermann Hering/ }).click();
  await moderacao.getByRole('button', { name: 'Marcar como Encaminhada à prefeitura' }).click();
  await expect(moderacao.getByRole('button', { name: 'Marcar como Em andamento' })).toBeVisible();
  await capturar(moderacao, '06-moderacao');

  // Maria recebe o aviso (T-09-01) e abre a ocorrência por ele.
  await expect(page.getByRole('button', { name: 'Avisos, 1 não lido' })).toBeVisible();
  await page.getByRole('button', { name: 'Avisos, 1 não lido' }).click();
  await capturar(page, '07-avisos');
  await page.getByRole('button', { name: /Alagamento: Encaminhada à prefeitura/ }).click();
  await expect(page.getByText('Encaminhada à prefeitura em')).toBeVisible();

  // Ocultada pela moderação, some para os moradores.
  await moderacao.getByRole('button', { name: 'Ocultar dos moradores' }).click();
  await expect(moderacao.getByText('Oculta para os moradores')).toBeVisible();
  await jose.goto('/');
  await expect(jose.getByText('Nenhuma ocorrência por aqui ainda.')).toBeVisible();
});

test('mapa mostra um ponto por ocorrência', async ({ page }) => {
  await cadastrar(page, 'maria@exemplo.com');
  await preencherOcorrencia(page, 'Iluminação', 'Poste apagado');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Ocorrência registrada. Obrigado!')).toBeVisible();

  await page.getByRole('button', { name: 'Ver no mapa' }).click();
  await expect(page.getByTestId('marcador')).toHaveCount(1);
});
