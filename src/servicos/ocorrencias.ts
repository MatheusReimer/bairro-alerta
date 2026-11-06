import { apoiar } from '../domain/apoio';
import { mudarStatus, ocultar, reexibir } from '../domain/moderacao';
import { destinatarios, textoNotificacao } from '../domain/notificacao';
import { criarOcorrencia, validarNovaOcorrencia, type Rascunho, type Status } from '../domain/ocorrencia';
import { ErroRegra, type Ator } from '../domain/regras';
import type { Repositorio } from '../dados/tipos';
import { removerMetadados } from './exif';

/** Limite de uma foto no Firestore (documento de até 1 MiB). Repetido em firestore.rules. */
export const FOTO_MAXIMA_BYTES = 700 * 1024;

export type Dependencias = {
  /** Lê a foto já comprimida em JPEG a partir da URI local. */
  lerFoto(uri: string): Promise<Uint8Array>;
  agora(): number;
};

/** Casos de uso do app: aplica as regras do domínio e grava pelo repositório. */
export class ServicoOcorrencias {
  constructor(
    private readonly repo: Repositorio,
    private readonly deps: Dependencias,
  ) {}

  async registrar(rascunho: Rascunho, autor: Ator): Promise<string> {
    const erros = Object.values(validarNovaOcorrencia(rascunho));
    if (erros.length > 0) throw new ErroRegra(erros[0]!);

    const foto = removerMetadados(await this.deps.lerFoto(rascunho.fotoUri!));
    if (foto.length > FOTO_MAXIMA_BYTES) throw new ErroRegra('A foto ficou grande demais. Tente tirar de novo.');
    const fotoPath = await this.repo.enviarFoto(autor.uid, foto);
    return this.repo.inserir(criarOcorrencia(rascunho, autor.uid, fotoPath, this.deps.agora()));
  }

  async apoiar(id: string, ator: Ator): Promise<void> {
    await this.repo.alterar(id, (atual) => ({ ocorrencia: apoiar(atual, ator.uid) }));
  }

  async mudarStatus(id: string, novo: Status, ator: Ator): Promise<void> {
    const agora = this.deps.agora();
    await this.repo.alterar(id, (antes) => {
      const depois = mudarStatus(antes, novo, ator, agora);
      const texto = textoNotificacao(depois);
      const avisos = destinatarios(antes, depois, ator.uid).map((para) => ({
        para,
        ocorrenciaId: id,
        criadoEm: agora,
        ...texto,
      }));
      return { ocorrencia: depois, avisos };
    });
  }

  async definirOculta(id: string, oculta: boolean, ator: Ator): Promise<void> {
    await this.repo.alterar(id, (atual) => ({ ocorrencia: oculta ? ocultar(atual, ator) : reexibir(atual, ator) }));
  }
}
