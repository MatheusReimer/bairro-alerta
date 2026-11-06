// Acesso administrativo aos emuladores (fora das regras de segurança) para preparar e conferir os cenários.
const PROJETO = 'demo-bairro-alerta';
const FIRESTORE = `http://127.0.0.1:8181`;
const AUTH = `http://127.0.0.1:9099`;
const STORAGE = `http://127.0.0.1:9199`;
const DOCS = `${FIRESTORE}/v1/projects/${PROJETO}/databases/(default)/documents`;
const ADMIN = { Authorization: 'Bearer owner' };

async function ok(resposta: Response) {
  if (!resposta.ok) throw new Error(`${resposta.status} ${resposta.url}: ${await resposta.text()}`);
  return resposta;
}

export async function limparEmuladores() {
  await ok(await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJETO}/databases/(default)/documents`, { method: 'DELETE' }));
  await ok(await fetch(`${AUTH}/emulator/v1/projects/${PROJETO}/accounts`, { method: 'DELETE' }));
}

/** Cria a conta e o perfil de moderador, como a associação faria pelo console do Firebase. */
export async function criarModerador(email: string, senha: string) {
  const conta = await ok(
    await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    }),
  );
  const { localId } = (await conta.json()) as { localId: string };
  await ok(
    await fetch(`${DOCS}/moderadores/${localId}`, {
      method: 'PATCH',
      headers: { ...ADMIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { nome: { stringValue: 'Associação de Moradores' } } }),
    }),
  );
}

type Campo = { stringValue?: string; integerValue?: string; booleanValue?: boolean; arrayValue?: { values?: Campo[] } };
export type DocOcorrencia = { id: string; campos: Record<string, Campo> };

export async function lerOcorrencias(): Promise<DocOcorrencia[]> {
  const resposta = await ok(await fetch(`${DOCS}/ocorrencias`, { headers: ADMIN }));
  const { documents = [] } = (await resposta.json()) as { documents?: { name: string; fields: Record<string, Campo> }[] };
  return documents.map((d) => ({ id: d.name.split('/').pop()!, campos: d.fields }));
}

export async function baixarFoto(fotoPath: string): Promise<Buffer> {
  const url = `${STORAGE}/v0/b/${PROJETO}.appspot.com/o/${encodeURIComponent(fotoPath)}?alt=media`;
  return Buffer.from(await (await ok(await fetch(url, { headers: ADMIN }))).arrayBuffer());
}
