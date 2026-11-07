import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import type { Status } from '../domain/ocorrencia';

/**
 * Tokens do protótipo "widgets suaves" com a paleta Grafite e lima (design/prototipo.html):
 * fundo cinza quente, widgets brancos arredondados, widget de dados quase preto e lima como cor de ação.
 */
export type Cores = {
  fundo: string;
  cartao: string;
  linha: string;
  borda: string;
  trilho: string;
  texto: string;
  suave: string;
  /** Widget de dados (estatísticas) e chips selecionados. */
  dados: string;
  dadosTexto: string;
  dadosSuave: string;
  dadosBarra: string;
  /** Widget de apoios do acompanhamento. */
  apoio: string;
  apoioSuave: string;
  /** Lima: cor de ação, sempre com texto escuro por cima. */
  destaque: string;
  sobreDestaque: string;
  /** Texto e ícones em lima ou verde-oliva, legíveis sobre o fundo e os widgets. */
  destaqueTexto: string;
  chipAtivo: string;
  chipAtivoTexto: string;
  chipAtivoIcone: string;
  erro: string;
  erroFundo: string;
  vidro: string;
  veu: string;
  navegacao: string;
  navegacaoAtiva: string;
  navegacaoInativa: string;
};

export type CoresMapa = { terra: string; parque: string; agua: string; rua: string };
export type Par = { fundo: string; texto: string };

const LIMA = '#D4F25A';
const GRAFITE = '#161616';

const claro: Cores = {
  fundo: '#EBEBE7',
  cartao: '#FFFFFF',
  linha: '#E2E2DD',
  borda: '#D8D8D3',
  trilho: '#D2D2CC',
  texto: GRAFITE,
  suave: '#696965',
  dados: '#1A1A1A',
  dadosTexto: '#F2F2EE',
  dadosSuave: '#9C9C96',
  dadosBarra: '#363636',
  apoio: GRAFITE,
  apoioSuave: '#B5B5AE',
  destaque: LIMA,
  sobreDestaque: GRAFITE,
  destaqueTexto: '#4F6B00',
  chipAtivo: '#1A1A1A',
  chipAtivoTexto: '#F2F2EE',
  chipAtivoIcone: LIMA,
  erro: '#B42318',
  erroFundo: '#FCE8E6',
  vidro: 'rgba(255,255,255,0.94)',
  veu: 'rgba(10,10,10,0.55)',
  navegacao: GRAFITE,
  navegacaoAtiva: '#F2F2EE',
  navegacaoInativa: '#8F8F8A',
};

const escuro: Cores = {
  fundo: '#111111',
  cartao: '#1C1C1C',
  linha: '#2A2A2A',
  borda: '#343432',
  trilho: '#333333',
  texto: '#F2F2EE',
  suave: '#9C9C96',
  dados: '#262626',
  dadosTexto: '#F2F2EE',
  dadosSuave: '#A3A39D',
  dadosBarra: '#3A3A3A',
  apoio: '#262626',
  apoioSuave: '#B5B5AE',
  destaque: LIMA,
  sobreDestaque: GRAFITE,
  destaqueTexto: LIMA,
  chipAtivo: '#F2F2EE',
  chipAtivoTexto: GRAFITE,
  chipAtivoIcone: '#4F6B00',
  erro: '#FF8A80',
  erroFundo: '#3A1D1B',
  vidro: 'rgba(28,28,28,0.94)',
  veu: 'rgba(0,0,0,0.6)',
  navegacao: '#2A2A2A',
  navegacaoAtiva: '#F2F2EE',
  navegacaoInativa: '#9C9C96',
};

/** Selos de status: texto escuro sobre tom claro (ou o inverso no escuro), contraste AA nos dois temas. */
const statusClaro: Record<Status, Par> = {
  aberta: { fundo: '#EFEFEB', texto: '#4A4A46' },
  encaminhada: { fundo: '#E1E9F0', texto: '#284B66' },
  em_andamento: { fundo: '#EFF7C9', texto: '#4F6B00' },
  resolvida: { fundo: '#1A1A1A', texto: LIMA },
};

const statusEscuro: Record<Status, Par> = {
  aberta: { fundo: '#2E2E2C', texto: '#E2E2DC' },
  encaminhada: { fundo: '#22303B', texto: '#A9C8E0' },
  em_andamento: { fundo: '#2C3315', texto: LIMA },
  resolvida: { fundo: LIMA, texto: GRAFITE },
};

const mapaClaro: CoresMapa = { terra: '#E0E0DB', parque: '#D3DEC0', agua: '#D3DCE0', rua: '#F8F8F5' };
const mapaEscuro: CoresMapa = { terra: '#1F1F1E', parque: '#263020', agua: '#1D262B', rua: '#2E2E2C' };

/** Pinos do mapa: o mais apoiado em lima, os demais em contraste com o mapa e os resolvidos apagados. */
type Pinos = { forte: Par; padrao: Par; fraco: Par };
const pinosClaro: Pinos = {
  forte: { fundo: LIMA, texto: GRAFITE },
  padrao: { fundo: '#1A1A1A', texto: '#FFFFFF' },
  fraco: { fundo: '#FFFFFF', texto: GRAFITE },
};
const pinosEscuro: Pinos = {
  forte: { fundo: LIMA, texto: GRAFITE },
  padrao: { fundo: '#F2F2EE', texto: GRAFITE },
  fraco: { fundo: '#3A3A3A', texto: '#F2F2EE' },
};

/** Geist no texto e Bricolage Grotesque nos títulos, carregadas em src/app/_layout.tsx. */
export const fontes = {
  regular: 'Geist_400Regular',
  media: 'Geist_500Medium',
  semi: 'Geist_600SemiBold',
  negrito: 'Geist_700Bold',
  titulo: 'BricolageGrotesque_700Bold',
} as const;

export type Tema = {
  escuro: boolean;
  cores: Cores;
  status: Record<Status, Par>;
  mapa: CoresMapa;
  pinos: Pinos;
};

export const temaClaro: Tema = { escuro: false, cores: claro, status: statusClaro, mapa: mapaClaro, pinos: pinosClaro };
export const temaEscuro: Tema = { escuro: true, cores: escuro, status: statusEscuro, mapa: mapaEscuro, pinos: pinosEscuro };

export function useTema(): Tema {
  return useColorScheme() === 'dark' ? temaEscuro : temaClaro;
}

/** Estilos que dependem do tema, recriados só quando o tema muda. */
export function useEstilos<T>(fabrica: (t: Tema) => T): T {
  const tema = useTema();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => fabrica(tema), [tema]);
}

/** Cor com transparência, para halos e véus (#RRGGBB + alfa 0..1). */
export function comAlfa(hex: string, alfa: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
}
