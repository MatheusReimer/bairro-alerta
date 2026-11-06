import type { NovaOcorrencia, Ocorrencia } from '../domain/ocorrencia';
import {
  ErroAutenticacao,
  type Alteracao,
  type Autenticacao,
  type Aviso,
  type Cancelar,
  type Repositorio,
  type Usuario,
} from './tipos';

type Ouvinte<T> = (valor: T) => void;

/** Repositório em memória com o mesmo comportamento observável do Firestore. Usado nos testes de componente. */
export class RepositorioMemoria implements Repositorio {
  readonly fotos = new Map<string, Uint8Array>();
  private ocorrencias = new Map<string, Ocorrencia>();
  private avisos = new Map<string, Aviso[]>();
  private ouvintesOcorrencias = new Set<{ moderador: boolean; cb: Ouvinte<Ocorrencia[]> }>();
  private ouvintesAvisos = new Set<{ uid: string; cb: Ouvinte<Aviso[]> }>();
  private sequencia = 0;

  constructor(iniciais: Ocorrencia[] = []) {
    iniciais.forEach((o) => this.ocorrencias.set(o.id, o));
  }

  todas(): Ocorrencia[] {
    return [...this.ocorrencias.values()];
  }

  avisosDe(uid: string): Aviso[] {
    return this.avisos.get(uid) ?? [];
  }

  private visiveis(moderador: boolean) {
    return this.todas().filter((o) => moderador || !o.oculta);
  }

  private notificarOcorrencias() {
    this.ouvintesOcorrencias.forEach(({ moderador, cb }) => cb(this.visiveis(moderador)));
  }

  private notificarAvisos(uid: string) {
    this.ouvintesAvisos.forEach((o) => o.uid === uid && o.cb(this.avisosDe(uid)));
  }

  observarOcorrencias(moderador: boolean, cb: Ouvinte<Ocorrencia[]>): Cancelar {
    const ouvinte = { moderador, cb };
    this.ouvintesOcorrencias.add(ouvinte);
    cb(this.visiveis(moderador));
    return () => this.ouvintesOcorrencias.delete(ouvinte);
  }

  async enviarFoto(uid: string, jpeg: Uint8Array): Promise<string> {
    const path = `fotos/foto-${uid}-${++this.sequencia}`;
    this.fotos.set(path, jpeg);
    return path;
  }

  async urlDaFoto(fotoPath: string): Promise<string> {
    return `memoria://${fotoPath}`;
  }

  async inserir(nova: NovaOcorrencia): Promise<string> {
    const id = `oc-memoria-${++this.sequencia}`;
    this.ocorrencias.set(id, { ...nova, id });
    this.notificarOcorrencias();
    return id;
  }

  async alterar(id: string, alterar: (atual: Ocorrencia) => Alteracao): Promise<Ocorrencia> {
    const atual = this.ocorrencias.get(id);
    if (!atual) throw new Error('Ocorrência não encontrada.');
    const { ocorrencia, avisos = [] } = alterar(atual);
    this.ocorrencias.set(id, ocorrencia);
    for (const { para, ...aviso } of avisos) {
      this.avisos.set(para, [...this.avisosDe(para), { ...aviso, id: `av-${++this.sequencia}`, lido: false }]);
      this.notificarAvisos(para);
    }
    this.notificarOcorrencias();
    return ocorrencia;
  }

  observarAvisos(uid: string, cb: Ouvinte<Aviso[]>): Cancelar {
    const ouvinte = { uid, cb };
    this.ouvintesAvisos.add(ouvinte);
    cb(this.avisosDe(uid));
    return () => this.ouvintesAvisos.delete(ouvinte);
  }

  async marcarAvisoLido(uid: string, avisoId: string): Promise<void> {
    this.avisos.set(
      uid,
      this.avisosDe(uid).map((a) => (a.id === avisoId ? { ...a, lido: true } : a)),
    );
    this.notificarAvisos(uid);
  }
}

/** Autenticação em memória: e-mails e senhas num mapa, com os mesmos códigos de erro do Firebase. */
export class AutenticacaoMemoria implements Autenticacao {
  private contas = new Map<string, { senha: string; usuario: Usuario }>();
  private atual: Usuario | null = null;
  private ouvintes = new Set<Ouvinte<Usuario | null>>();

  constructor(contas: { email: string; senha: string; moderador?: boolean }[] = []) {
    contas.forEach(({ email, senha, moderador = false }) =>
      this.contas.set(email, { senha, usuario: { uid: `uid-${email}`, email, moderador } }),
    );
  }

  private definir(usuario: Usuario | null) {
    this.atual = usuario;
    this.ouvintes.forEach((cb) => cb(usuario));
  }

  observar(cb: Ouvinte<Usuario | null>): Cancelar {
    this.ouvintes.add(cb);
    cb(this.atual);
    return () => this.ouvintes.delete(cb);
  }

  async cadastrar(email: string, senha: string): Promise<void> {
    if (this.contas.has(email)) throw new ErroAutenticacao('auth/email-already-in-use');
    const usuario = { uid: `uid-${email}`, email, moderador: false };
    this.contas.set(email, { senha, usuario });
    this.definir(usuario);
  }

  async entrar(email: string, senha: string): Promise<void> {
    const conta = this.contas.get(email);
    if (!conta || conta.senha !== senha) throw new ErroAutenticacao('auth/invalid-credential');
    this.definir(conta.usuario);
  }

  async sair(): Promise<void> {
    this.definir(null);
  }
}
