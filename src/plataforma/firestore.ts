import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  addDoc,
  Bytes,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';

import type { NovaOcorrencia, Ocorrencia } from '../domain/ocorrencia';
import {
  ErroAutenticacao,
  type Alteracao,
  type Autenticacao,
  type Aviso,
  type Cancelar,
  type Repositorio,
  type Usuario,
} from '../dados/tipos';

/**
 * Repositório no Cloud Firestore. A autorização é garantida por firestore.rules.
 * As fotos ficam na coleção `fotos` (o Cloud Storage exige o plano pago do Firebase).
 */
export class RepositorioFirestore implements Repositorio {
  private readonly cacheFotos = new Map<string, string>();

  constructor(private readonly db: Firestore) {}

  observarOcorrencias(moderador: boolean, aoMudar: (lista: Ocorrencia[]) => void): Cancelar {
    const col = collection(this.db, 'ocorrencias');
    const consulta = moderador ? col : query(col, where('oculta', '==', false));
    return onSnapshot(
      consulta,
      (snap) => aoMudar(snap.docs.map((d) => ({ ...(d.data() as NovaOcorrencia), id: d.id }))),
      (erro) => console.warn('[ocorrencias]', erro.code),
    );
  }

  async enviarFoto(uid: string, jpeg: Uint8Array): Promise<string> {
    const foto = await addDoc(collection(this.db, 'fotos'), {
      autorId: uid,
      jpeg: Bytes.fromUint8Array(jpeg),
      criadaEm: Date.now(),
    });
    return `fotos/${foto.id}`;
  }

  async urlDaFoto(fotoPath: string): Promise<string> {
    const emCache = this.cacheFotos.get(fotoPath);
    if (emCache) return emCache;
    const snap = await getDoc(doc(this.db, fotoPath));
    if (!snap.exists()) throw new Error('Foto não encontrada.');
    const url = `data:image/jpeg;base64,${(snap.data().jpeg as Bytes).toBase64()}`;
    this.cacheFotos.set(fotoPath, url);
    return url;
  }

  async inserir(nova: NovaOcorrencia): Promise<string> {
    return (await addDoc(collection(this.db, 'ocorrencias'), nova)).id;
  }

  alterar(id: string, alterar: (atual: Ocorrencia) => Alteracao): Promise<Ocorrencia> {
    const referencia = doc(this.db, 'ocorrencias', id);
    return runTransaction(this.db, async (tx) => {
      const snap = await tx.get(referencia);
      if (!snap.exists()) throw new Error('Ocorrência não encontrada.');
      const { ocorrencia, avisos = [] } = alterar({ ...(snap.data() as NovaOcorrencia), id });
      const { id: _id, ...dados } = ocorrencia;
      tx.set(referencia, dados);
      for (const { para, ...aviso } of avisos) {
        tx.set(doc(collection(this.db, 'usuarios', para, 'avisos')), { ...aviso, lido: false });
      }
      return ocorrencia;
    });
  }

  observarAvisos(uid: string, aoMudar: (avisos: Aviso[]) => void): Cancelar {
    const consulta = query(collection(this.db, 'usuarios', uid, 'avisos'), orderBy('criadoEm', 'desc'));
    return onSnapshot(
      consulta,
      (snap) => aoMudar(snap.docs.map((d) => ({ ...(d.data() as Omit<Aviso, 'id'>), id: d.id }))),
      (erro) => console.warn('[avisos]', erro.code),
    );
  }

  async marcarAvisoLido(uid: string, avisoId: string): Promise<void> {
    await updateDoc(doc(this.db, 'usuarios', uid, 'avisos', avisoId), { lido: true });
  }
}

function comCodigo(erro: unknown): never {
  throw new ErroAutenticacao(erro instanceof FirebaseError ? erro.code : 'desconhecido');
}

export class AutenticacaoFirebase implements Autenticacao {
  constructor(
    private readonly auth: Auth,
    private readonly db: Firestore,
  ) {}

  observar(aoMudar: (usuario: Usuario | null) => void): Cancelar {
    return onAuthStateChanged(this.auth, async (u) => {
      if (!u) return aoMudar(null);
      // Moderador é quem a associação cadastrou em /moderadores pelo console; o app só consulta.
      const perfil = await getDoc(doc(this.db, 'moderadores', u.uid)).catch(() => null);
      aoMudar({ uid: u.uid, email: u.email ?? '', moderador: perfil?.exists() ?? false });
    });
  }

  async cadastrar(email: string, senha: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email.trim(), senha).catch(comCodigo);
  }

  async entrar(email: string, senha: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email.trim(), senha).catch(comCodigo);
  }

  async sair(): Promise<void> {
    await signOut(this.auth);
  }
}
