import type { Ocorrencia } from './ocorrencia';
import { ErroRegra } from './regras';

/** "Eu também vi": um apoio por morador, sem contar o autor. Mostra à prefeitura quantas pessoas são afetadas. */
export function apoiar(oc: Ocorrencia, uid: string): Ocorrencia {
  if (oc.autorId === uid) throw new ErroRegra('Você não pode apoiar a própria ocorrência.');
  if (oc.apoiadores.includes(uid)) throw new ErroRegra('Você já apoiou esta ocorrência.');
  if (oc.status === 'resolvida') throw new ErroRegra('Esta ocorrência já foi resolvida.');
  return { ...oc, apoios: oc.apoios + 1, apoiadores: [...oc.apoiadores, uid] };
}
