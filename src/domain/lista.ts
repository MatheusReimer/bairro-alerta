import type { Categoria, Ocorrencia, Status } from './ocorrencia';

export type Filtro = { categoria?: Categoria; status?: Status };
export type Leitor = { moderador: boolean };

/** Lista do bairro: aplica os filtros, esconde as ocultas de quem não modera e mostra as mais recentes primeiro. */
export function filtrarOcorrencias(lista: readonly Ocorrencia[], filtro: Filtro, leitor: Leitor): Ocorrencia[] {
  return lista
    .filter((o) => leitor.moderador || !o.oculta)
    .filter((o) => !filtro.categoria || o.categoria === filtro.categoria)
    .filter((o) => !filtro.status || o.status === filtro.status)
    .sort((a, b) => b.criadaEm - a.criadaEm);
}
