import type { Ocorrencia } from '../domain/ocorrencia';

// Praça Vila Nova, Blumenau (ponto de referência dos testes).
export const PRACA = { latitude: -26.9055, longitude: -49.0943 };

/** Desloca um ponto para o norte em metros (1 grau de latitude ≈ 111.195 m). */
export function aoNorte(metros: number, de = PRACA) {
  return { latitude: de.latitude + metros / 111_195, longitude: de.longitude };
}

let contador = 0;
export function ocorrencia(campos: Partial<Ocorrencia> = {}): Ocorrencia {
  contador += 1;
  return {
    id: `oc-${contador}`,
    autorId: 'uid-autor',
    categoria: 'buraco',
    descricao: '',
    fotoPath: `fotos/uid-autor/${contador}.jpg`,
    local: PRACA,
    status: 'aberta',
    oculta: false,
    apoios: 0,
    apoiadores: [],
    criadaEm: 1_000 + contador,
    historico: [{ status: 'aberta', em: 1_000 + contador }],
    ...campos,
  };
}
