import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  addDoc,
  Bytes,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const raiz = join(__dirname, '..', '..');
let env: RulesTestEnvironment;

const nova = (autorId: string) => ({
  autorId,
  categoria: 'buraco',
  descricao: 'Buraco fundo',
  fotoPath: `fotos/foto-${autorId}`,
  local: { latitude: -26.9, longitude: -49.09 },
  status: 'aberta',
  oculta: false,
  apoios: 0,
  apoiadores: [],
  criadaEm: 1000,
  historico: [{ status: 'aberta', em: 1000 }],
});

const jpeg = (tamanho = 4) => Bytes.fromUint8Array(new Uint8Array(tamanho).fill(0xff));
const foto = (autorId: string, tamanho?: number) => ({ autorId, jpeg: jpeg(tamanho), criadaEm: 1000 });
const LIMITE_FOTO = 700 * 1024;

const db = (uid?: string) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-bairro-alerta',
    firestore: { rules: readFileSync(join(raiz, 'firestore.rules'), 'utf8') },
  });
});

afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const admin = ctx.firestore();
    await setDoc(doc(admin, 'moderadores/mod'), { nome: 'Associação' });
    await setDoc(doc(admin, 'fotos/foto-joao'), foto('joao'));
    await setDoc(doc(admin, 'fotos/foto-maria'), foto('maria'));
    await setDoc(doc(admin, 'ocorrencias/oc1'), nova('joao'));
    await setDoc(doc(admin, 'ocorrencias/oculta'), { ...nova('joao'), oculta: true });
    await setDoc(doc(admin, 'usuarios/joao/avisos/a1'), {
      ocorrenciaId: 'oc1', titulo: 't', corpo: 'c', criadoEm: 1, lido: false,
    });
  });
});

describe('leitura', () => {
  it('T-SEG-01 usuário não autenticado não lê ocorrências', async () => {
    await assertFails(getDoc(doc(db(), 'ocorrencias/oc1')));
  });

  it('morador autenticado lê ocorrência visível', async () => {
    await assertSucceeds(getDoc(doc(db('maria'), 'ocorrencias/oc1')));
  });

  it('morador não lê ocorrência oculta', async () => {
    await assertFails(getDoc(doc(db('maria'), 'ocorrencias/oculta')));
  });

  it('morador só lista com o filtro de visíveis', async () => {
    await assertSucceeds(getDocs(query(collection(db('maria'), 'ocorrencias'), where('oculta', '==', false))));
    await assertFails(getDocs(collection(db('maria'), 'ocorrencias')));
  });

  it('moderador lê ocorrência oculta e lista tudo', async () => {
    await assertSucceeds(getDoc(doc(db('mod'), 'ocorrencias/oculta')));
    await assertSucceeds(getDocs(collection(db('mod'), 'ocorrencias')));
  });

  it('ninguém se promove a moderador', async () => {
    await assertFails(setDoc(doc(db('maria'), 'moderadores/maria'), {}));
  });
});

describe('criação (história #4)', () => {
  it('morador cria ocorrência própria e válida', async () => {
    await assertSucceeds(addDoc(collection(db('maria'), 'ocorrencias'), nova('maria')));
  });

  it('não cria em nome de outra pessoa', async () => {
    await assertFails(addDoc(collection(db('maria'), 'ocorrencias'), nova('joao')));
  });

  it('não cria já resolvida, com apoios ou oculta', async () => {
    const col = collection(db('maria'), 'ocorrencias');
    await assertFails(addDoc(col, { ...nova('maria'), status: 'resolvida' }));
    await assertFails(addDoc(col, { ...nova('maria'), apoios: 10 }));
    await assertFails(addDoc(col, { ...nova('maria'), oculta: true }));
  });

  it('não aceita categoria fora da lista nem descrição longa', async () => {
    const col = collection(db('maria'), 'ocorrencias');
    await assertFails(addDoc(col, { ...nova('maria'), categoria: 'barulho' }));
    await assertFails(addDoc(col, { ...nova('maria'), descricao: 'a'.repeat(501) }));
  });

  it('T-SEG-04 não aceita campos extras como e-mail do autor', async () => {
    await assertFails(addDoc(collection(db('maria'), 'ocorrencias'), { ...nova('maria'), email: 'maria@x.com' }));
  });

  it('não aponta para foto de outra pessoa nem para foto inexistente', async () => {
    const col = collection(db('maria'), 'ocorrencias');
    await assertFails(addDoc(col, { ...nova('maria'), fotoPath: 'fotos/foto-joao' }));
    await assertFails(addDoc(col, { ...nova('maria'), fotoPath: 'fotos/nao-existe' }));
    await assertFails(addDoc(col, { ...nova('maria'), fotoPath: 'ocorrencias/oc1' }));
  });
});

describe('apoios (história #7)', () => {
  it('morador apoia uma vez', async () => {
    await assertSucceeds(updateDoc(doc(db('maria'), 'ocorrencias/oc1'), { apoios: 1, apoiadores: ['maria'] }));
  });

  it('T-07-04 morador não altera o contador direto', async () => {
    await assertFails(updateDoc(doc(db('maria'), 'ocorrencias/oc1'), { apoios: 50 }));
    await assertFails(updateDoc(doc(db('maria'), 'ocorrencias/oc1'), { apoios: 2, apoiadores: ['maria', 'x'] }));
    await assertFails(updateDoc(doc(db('maria'), 'ocorrencias/oc1'), { apoios: 1, apoiadores: ['outra'] }));
  });

  it('autor não apoia a própria ocorrência', async () => {
    await assertFails(updateDoc(doc(db('joao'), 'ocorrencias/oc1'), { apoios: 1, apoiadores: ['joao'] }));
  });

  it('não apoia duas vezes', async () => {
    await updateDoc(doc(db('maria'), 'ocorrencias/oc1'), { apoios: 1, apoiadores: ['maria'] });
    await assertFails(updateDoc(doc(db('maria'), 'ocorrencias/oc1'), { apoios: 2, apoiadores: ['maria', 'maria'] }));
  });
});

describe('moderação (história #8)', () => {
  const encaminhar = { status: 'encaminhada', historico: [{ status: 'aberta', em: 1000 }, { status: 'encaminhada', em: 2000 }] };

  it('T-08-04 morador comum não muda status', async () => {
    await assertFails(updateDoc(doc(db('maria'), 'ocorrencias/oc1'), encaminhar));
    await assertFails(updateDoc(doc(db('joao'), 'ocorrencias/oc1'), encaminhar));
  });

  it('T-08-05 morador comum não oculta', async () => {
    await assertFails(updateDoc(doc(db('maria'), 'ocorrencias/oc1'), { oculta: true }));
  });

  it('moderador muda status e oculta', async () => {
    await assertSucceeds(updateDoc(doc(db('mod'), 'ocorrencias/oc1'), encaminhar));
    await assertSucceeds(updateDoc(doc(db('mod'), 'ocorrencias/oc1'), { oculta: true }));
  });

  it('moderador não pula etapas nem mexe nos apoios', async () => {
    await assertFails(updateDoc(doc(db('mod'), 'ocorrencias/oc1'), { status: 'resolvida' }));
    await assertFails(updateDoc(doc(db('mod'), 'ocorrencias/oc1'), { apoios: 99 }));
  });

  it('T-SEG-02 ninguém edita o conteúdo de uma ocorrência, nem o autor', async () => {
    await assertFails(updateDoc(doc(db('maria'), 'ocorrencias/oc1'), { descricao: 'editada' }));
    await assertFails(updateDoc(doc(db('joao'), 'ocorrencias/oc1'), { descricao: 'editada' }));
  });
});

describe('avisos (história #9)', () => {
  const aviso = { ocorrenciaId: 'oc1', titulo: 'Buraco: Encaminhada', corpo: 'mudou', criadoEm: 2, lido: false };

  it('cada morador lê só os próprios avisos', async () => {
    await assertSucceeds(getDocs(collection(db('joao'), 'usuarios/joao/avisos')));
    await assertFails(getDocs(collection(db('maria'), 'usuarios/joao/avisos')));
  });

  it('só o moderador cria avisos para outras pessoas', async () => {
    await assertFails(addDoc(collection(db('maria'), 'usuarios/joao/avisos'), aviso));
    await assertSucceeds(addDoc(collection(db('mod'), 'usuarios/joao/avisos'), aviso));
  });

  it('o dono só marca o aviso como lido', async () => {
    await assertSucceeds(updateDoc(doc(db('joao'), 'usuarios/joao/avisos/a1'), { lido: true }));
    await assertFails(updateDoc(doc(db('joao'), 'usuarios/joao/avisos/a1'), { titulo: 'falso' }));
  });

  it('mudança de status e avisos gravam juntos num lote', async () => {
    const m = db('mod');
    const lote = writeBatch(m);
    lote.update(doc(m, 'ocorrencias/oc1'), { status: 'encaminhada', historico: [{ status: 'aberta', em: 1000 }, { status: 'encaminhada', em: 2 }] });
    lote.set(doc(collection(m, 'usuarios/joao/avisos')), aviso);
    await assertSucceeds(lote.commit());
  });
});

describe('fotos (T-SEG-03)', () => {
  it('morador envia foto na própria conta', async () => {
    await assertSucceeds(addDoc(collection(db('maria'), 'fotos'), foto('maria')));
  });

  it('não envia foto em nome de outra pessoa', async () => {
    await assertFails(addDoc(collection(db('maria'), 'fotos'), foto('joao')));
  });

  it('visitante sem login não envia nem vê fotos', async () => {
    await assertFails(addDoc(collection(db(), 'fotos'), foto('maria')));
    await assertFails(getDoc(doc(db(), 'fotos/foto-maria')));
  });

  it('morador logado vê as fotos', async () => {
    await assertSucceeds(getDoc(doc(db('joao'), 'fotos/foto-maria')));
  });

  it('não aceita foto acima de 700 KB nem conteúdo que não seja binário', async () => {
    const col = collection(db('maria'), 'fotos');
    await assertSucceeds(addDoc(col, foto('maria', LIMITE_FOTO)));
    await assertFails(addDoc(col, foto('maria', LIMITE_FOTO + 1)));
    await assertFails(addDoc(col, { autorId: 'maria', jpeg: 'texto', criadaEm: 1 }));
  });

  it('não aceita campos extras', async () => {
    await assertFails(addDoc(collection(db('maria'), 'fotos'), { ...foto('maria'), email: 'maria@x.com' }));
  });

  it('ninguém altera nem apaga foto enviada', async () => {
    await assertFails(setDoc(doc(db('maria'), 'fotos/foto-maria'), foto('maria')));
    await assertFails(updateDoc(doc(db('maria'), 'fotos/foto-maria'), { criadaEm: 2 }));
  });
});
