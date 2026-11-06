import { ROTULO_STATUS, type Ocorrencia, type Status } from './ocorrencia';
import { ErroRegra, type Ator } from './regras';

/** Sequência de andamento. "resolvida → aberta" existe para reabrir quando o problema volta. */
const TRANSICOES: Record<Status, Status[]> = {
  aberta: ['encaminhada'],
  encaminhada: ['em_andamento', 'resolvida'],
  em_andamento: ['resolvida'],
  resolvida: ['aberta'],
};

export function proximosStatus(atual: Status): Status[] {
  return TRANSICOES[atual];
}

function exigirModerador(ator: Ator, mensagem: string) {
  if (!ator.moderador) throw new ErroRegra(mensagem);
}

export function mudarStatus(oc: Ocorrencia, novo: Status, ator: Ator, agora: number): Ocorrencia {
  exigirModerador(ator, 'Só a moderação pode mudar o status.');
  if (!TRANSICOES[oc.status].includes(novo)) {
    throw new ErroRegra(`Não é possível passar de "${ROTULO_STATUS[oc.status]}" para "${ROTULO_STATUS[novo]}".`);
  }
  return { ...oc, status: novo, historico: [...oc.historico, { status: novo, em: agora }] };
}

export function ocultar(oc: Ocorrencia, ator: Ator): Ocorrencia {
  exigirModerador(ator, 'Só a moderação pode ocultar registros.');
  return { ...oc, oculta: true };
}

export function reexibir(oc: Ocorrencia, ator: Ator): Ocorrencia {
  exigirModerador(ator, 'Só a moderação pode ocultar registros.');
  return { ...oc, oculta: false };
}
