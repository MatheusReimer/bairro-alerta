import { ROTULO_STATUS, rotuloCategoria, type Ocorrencia } from './ocorrencia';

/** Quem deve ser avisado de uma mudança: autor e apoiadores, só se o status mudou, sem avisar quem mudou. */
export function destinatarios(antes: Ocorrencia, depois: Ocorrencia, quemMudou: string): string[] {
  if (antes.status === depois.status) return [];
  return [...new Set([depois.autorId, ...depois.apoiadores])].filter((uid) => uid !== quemMudou);
}

export function textoNotificacao(oc: Ocorrencia): { titulo: string; corpo: string } {
  return {
    titulo: `${rotuloCategoria(oc.categoria)}: ${ROTULO_STATUS[oc.status]}`,
    corpo:
      oc.status === 'resolvida'
        ? 'Problema resolvido! Obrigado por ajudar o bairro.'
        : 'A ocorrência que você acompanha mudou de status.',
  };
}
