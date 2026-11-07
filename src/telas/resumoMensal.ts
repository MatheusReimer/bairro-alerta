import type { Ocorrencia } from '../domain/ocorrencia';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export type ResumoMensal = {
  /** Resolvidas por mês, do mais antigo ao atual. */
  contagens: number[];
  atual: number;
  anterior: number;
  mesAnterior: string;
};

/** Índice absoluto do mês (ano * 12 + mês), no fuso do aparelho. */
const indiceMes = (ms: number) => {
  const d = new Date(ms);
  return d.getFullYear() * 12 + d.getMonth();
};

/** Quantas ocorrências foram resolvidas em cada um dos últimos `meses` meses, pela data do histórico. */
export function resolvidasPorMes(ocorrencias: readonly Ocorrencia[], agora: number, meses = 5): ResumoMensal {
  const atual = indiceMes(agora);
  const contagens = Array.from({ length: meses }, () => 0);
  for (const o of ocorrencias) {
    const resolvida = o.historico.find((h) => h.status === 'resolvida');
    if (!resolvida) continue;
    const distancia = atual - indiceMes(resolvida.em);
    if (distancia >= 0 && distancia < meses) contagens[meses - 1 - distancia] += 1;
  }
  return {
    contagens,
    atual: contagens[meses - 1],
    anterior: contagens[meses - 2] ?? 0,
    mesAnterior: MESES[(atual - 1) % 12],
  };
}

export function textoComparacao({ atual, anterior, mesAnterior }: ResumoMensal): string {
  const diferenca = atual - anterior;
  if (diferenca === 0) return `Igual a ${mesAnterior}`;
  return `${diferenca > 0 ? '+' : ''}${diferenca} em relação a ${mesAnterior}`;
}
