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
import { getDownloadURL, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';

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

/** Repositório no Cloud Firestore e Cloud Storage. A autorização é garantida por firestore.rules e storage.rules. */
export class RepositorioFirestore implements Repositorio {
  constructor(
    private readonly db: Firestore,
    private readonly storage: FirebaseStorage,
  ) {}

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
    const path = `fotos/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    await uploadBytes(ref(this.storage, path), jpeg, { contentType: 'image/jpeg' });
    return path;
  }

  urlDaFoto(fotoPath: string): Promise<string> {
    return getDownloadURL(ref(this.storage, fotoPath));
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
