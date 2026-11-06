import type { NovaOcorrencia, Ocorrencia } from '../domain/ocorrencia';

export type Usuario = { uid: string; email: string; moderador: boolean };

export type Aviso = {
  id: string;
  ocorrenciaId: string;
  titulo: string;
  corpo: string;
  criadoEm: number;
  lido: boolean;
};

export type NovoAviso = Omit<Aviso, 'id' | 'lido'> & { para: string };

export type Cancelar = () => void;

/** Resultado de uma alteração dentro de uma transação: o novo estado e os avisos a gravar junto. */
export type Alteracao = { ocorrencia: Ocorrencia; avisos?: NovoAviso[] };

/**
 * Acesso aos dados do bairro. A implementação em memória serve aos testes; a do Firestore, ao app.
 * As regras de negócio ficam no domínio e são repetidas nas regras de segurança do Firestore.
 */
export interface Repositorio {
  observarOcorrencias(moderador: boolean, aoMudar: (lista: Ocorrencia[]) => void): Cancelar;
  enviarFoto(uid: string, jpeg: Uint8Array): Promise<string>;
  urlDaFoto(fotoPath: string): Promise<string>;
  inserir(nova: NovaOcorrencia): Promise<string>;
  /** Lê a ocorrência, aplica `alterar` e grava atomicamente. Erros lançados por `alterar` cancelam tudo. */
  alterar(id: string, alterar: (atual: Ocorrencia) => Alteracao): Promise<Ocorrencia>;
  observarAvisos(uid: string, aoMudar: (avisos: Aviso[]) => void): Cancelar;
  marcarAvisoLido(uid: string, avisoId: string): Promise<void>;
}

export interface Autenticacao {
  observar(aoMudar: (usuario: Usuario | null) => void): Cancelar;
  cadastrar(email: string, senha: string): Promise<void>;
  entrar(email: string, senha: string): Promise<void>;
  sair(): Promise<void>;
}

/** Erro com o código do Firebase Auth (ex.: "auth/wrong-password"). */
export class ErroAutenticacao extends Error {
  constructor(public readonly codigo: string) {
    super(codigo);
    this.name = 'ErroAutenticacao';
  }
}
