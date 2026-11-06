export const CATEGORIAS = [
  { id: 'buraco', rotulo: 'Buraco', icone: '🕳️' },
  { id: 'iluminacao', rotulo: 'Iluminação', icone: '💡' },
  { id: 'entulho', rotulo: 'Entulho', icone: '🗑️' },
  { id: 'calcada', rotulo: 'Calçada', icone: '🚶' },
  { id: 'alagamento', rotulo: 'Alagamento', icone: '🌧️' },
  { id: 'outros', rotulo: 'Outros', icone: '📌' },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]['id'];

export const STATUS = ['aberta', 'encaminhada', 'em_andamento', 'resolvida'] as const;
export type Status = (typeof STATUS)[number];

export const ROTULO_STATUS: Record<Status, string> = {
  aberta: 'Aberta',
  encaminhada: 'Encaminhada à prefeitura',
  em_andamento: 'Em andamento',
  resolvida: 'Resolvida',
};

export type Local = { latitude: number; longitude: number };
export type EventoHistorico = { status: Status; em: number };

/** Documento público de uma ocorrência. Não guarda nome nem e-mail do autor (LGPD). */
export type NovaOcorrencia = {
  autorId: string;
  categoria: Categoria;
  descricao: string;
  fotoPath: string;
  local: Local;
  status: Status;
  oculta: boolean;
  apoios: number;
  apoiadores: string[];
  criadaEm: number;
  historico: EventoHistorico[];
};

export type Ocorrencia = NovaOcorrencia & { id: string };

/** O que o morador preencheu na tela de registro, antes do envio. */
export type Rascunho = {
  fotoUri: string | null;
  categoria: Categoria | null;
  local: Local | null;
  descricao: string;
};

export type ErrosRascunho = Partial<Record<'foto' | 'categoria' | 'local' | 'descricao', string>>;

export const DESCRICAO_MAXIMA = 500;

export function ehCategoria(valor: unknown): valor is Categoria {
  return CATEGORIAS.some((c) => c.id === valor);
}

export function rotuloCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((c) => c.id === categoria)!.rotulo;
}

function localValido(local: Local | null): local is Local {
  return (
    local !== null &&
    Number.isFinite(local.latitude) &&
    Number.isFinite(local.longitude) &&
    Math.abs(local.latitude) <= 90 &&
    Math.abs(local.longitude) <= 180
  );
}

export function validarNovaOcorrencia(r: Rascunho): ErrosRascunho {
  const erros: ErrosRascunho = {};
  if (!r.fotoUri) erros.foto = 'Tire ou escolha uma foto do problema.';
  if (!ehCategoria(r.categoria)) erros.categoria = 'Escolha uma categoria.';
  if (!localValido(r.local)) erros.local = 'Não conseguimos o local. Ative o GPS e tente de novo.';
  if (r.descricao.trim().length > DESCRICAO_MAXIMA) {
    erros.descricao = `A descrição pode ter no máximo ${DESCRICAO_MAXIMA} caracteres.`;
  }
  return erros;
}

export function criarOcorrencia(r: Rascunho, autorId: string, fotoPath: string, agora: number): NovaOcorrencia {
  if (Object.keys(validarNovaOcorrencia(r)).length > 0) throw new Error('Ocorrência inválida');
  return {
    autorId,
    categoria: r.categoria as Categoria,
    descricao: r.descricao.trim(),
    fotoPath,
    local: { latitude: r.local!.latitude, longitude: r.local!.longitude },
    status: 'aberta',
    oculta: false,
    apoios: 0,
    apoiadores: [],
    criadaEm: agora,
    historico: [{ status: 'aberta', em: agora }],
  };
}
