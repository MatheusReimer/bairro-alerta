import type { Categoria, Local, Ocorrencia } from './ocorrencia';

export const RAIO_SEMELHANTES_M = 50;
const RAIO_TERRA_M = 6_371_000;

const radianos = (graus: number) => (graus * Math.PI) / 180;

/** Distância em metros entre dois pontos pela fórmula de haversine. */
export function distanciaMetros(a: Local, b: Local): number {
  const dLat = radianos(b.latitude - a.latitude);
  const dLon = radianos(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(radianos(a.latitude)) * Math.cos(radianos(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(h));
}

/**
 * Antes do envio, procura registros do mesmo problema por perto para o morador apoiar em vez de duplicar:
 * mesma categoria, até 50 m, ainda não resolvidos e visíveis. Mais próximos primeiro.
 */
export function sugerirSemelhantes(
  nova: { categoria: Categoria; local: Local },
  existentes: readonly Ocorrencia[],
): Ocorrencia[] {
  return existentes
    .filter((o) => o.categoria === nova.categoria && o.status !== 'resolvida' && !o.oculta)
    .map((o) => ({ o, d: distanciaMetros(nova.local, o.local) }))
    .filter(({ d }) => d <= RAIO_SEMELHANTES_M)
    .sort((x, y) => x.d - y.d)
    .map(({ o }) => o);
}
