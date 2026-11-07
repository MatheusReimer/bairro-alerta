import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import type { Categoria, Ocorrencia } from '../domain/ocorrencia';
import { Icone, iconeDaCategoria } from './icones';
import { comAlfa, fontes, useTema, type Par } from './tema';

const MAX_PINOS = 8;

type Pino = { id: string; x: number; y: number; tamanho: number; par: Par; halo: string; texto?: string; categoria?: Categoria };

/** Pinos de exemplo, para a tela de entrar (antes do login não há dados do bairro). */
const EXEMPLO: { x: number; y: number; categoria: Categoria; nivel: 'forte' | 'padrao' | 'fraco' }[] = [
  { x: 0.38, y: 0.46, categoria: 'calcada', nivel: 'forte' },
  { x: 0.7, y: 0.66, categoria: 'alagamento', nivel: 'padrao' },
  { x: 0.2, y: 0.76, categoria: 'iluminacao', nivel: 'fraco' },
  { x: 0.84, y: 0.28, categoria: 'buraco', nivel: 'padrao' },
];

/**
 * Projeta as ocorrências numa caixa 0..1 mantendo a posição relativa entre elas (norte para cima).
 * Os números são os apoios (sem apoios, o ícone da categoria); o pino mais apoiado fica em lima e os resolvidos ficam apagados.
 */
export function posicionar(ocorrencias: readonly Ocorrencia[]): { o: Ocorrencia; x: number; y: number; nivel: 'forte' | 'padrao' | 'fraco' }[] {
  const escolhidas = [...ocorrencias].sort((a, b) => b.apoios - a.apoios).slice(0, MAX_PINOS);
  if (escolhidas.length === 0) return [];
  const lats = escolhidas.map((o) => o.local.latitude);
  const lngs = escolhidas.map((o) => o.local.longitude);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const escala = (v: number, min: number, max: number) => (max - min < 1e-9 ? 0.5 : (v - min) / (max - min));
  const forte = escolhidas.find((o) => o.status !== 'resolvida' && o.apoios > 0);
  return escolhidas.map((o) => ({
    o,
    x: 0.14 + 0.72 * escala(o.local.longitude, minLng, maxLng),
    y: 0.2 + 0.6 * (1 - escala(o.local.latitude, minLat, maxLat)),
    nivel: o === forte ? 'forte' : o.status === 'resolvida' ? 'fraco' : 'padrao',
  }));
}

type Props = { ocorrencias?: readonly Ocorrencia[]; exemplo?: boolean };

/** Mapa ilustrado do bairro (ruas genéricas) com os pinos das ocorrências. É decorativo: a lista ao lado é a fonte acessível. */
export function MapaEsquematico({ ocorrencias = [], exemplo }: Props) {
  const t = useTema();
  const halo = (nivel: 'forte' | 'padrao' | 'fraco') =>
    nivel === 'forte' ? comAlfa(t.pinos.forte.fundo, 0.25) : nivel === 'padrao' ? comAlfa(t.pinos.padrao.fundo, 0.16) : comAlfa(t.pinos.fraco.fundo, 0.4);
  const tamanho = { forte: 36, padrao: 30, fraco: 28 } as const;

  const pinos: Pino[] = exemplo
    ? EXEMPLO.map((p, i) => ({ id: String(i), x: p.x, y: p.y, tamanho: tamanho[p.nivel], par: t.pinos[p.nivel], halo: halo(p.nivel), categoria: p.categoria }))
    : posicionar(ocorrencias).map(({ o, x, y, nivel }) => ({
        id: o.id,
        x,
        y,
        tamanho: tamanho[nivel],
        par: t.pinos[nivel],
        halo: halo(nivel),
        // Sem apoios, o pino mostra o ícone da categoria em vez de um "0".
        ...(o.apoios > 0 ? { texto: String(o.apoios) } : { categoria: o.categoria }),
      }));

  return (
    <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 358 190" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Rect width={358} height={190} fill={t.mapa.terra} />
        <Path d="M250 120 q 50 -24 120 6 v 70 h -120 z" fill={t.mapa.agua} />
        <Rect x={160} y={58} width={52} height={36} rx={10} fill={t.mapa.parque} />
        <Path d="M-10 128 C 80 100, 160 158, 368 110" stroke={t.mapa.rua} strokeWidth={15} fill="none" />
        <Path d="M118 -10 L 146 200" stroke={t.mapa.rua} strokeWidth={11} />
        <Path d="M248 -10 L 228 200" stroke={t.mapa.rua} strokeWidth={9} />
        <Path d="M-10 46 L 368 30" stroke={t.mapa.rua} strokeWidth={7} />
      </Svg>
      {pinos.map((p) => (
        <View
          key={p.id}
          style={[
            estilos.pino,
            {
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              width: p.tamanho,
              height: p.tamanho,
              borderRadius: p.tamanho / 2,
              marginLeft: -p.tamanho / 2,
              marginTop: -p.tamanho / 2,
              backgroundColor: p.par.fundo,
              boxShadow: `0 0 0 ${p.tamanho > 30 ? 6 : 5}px ${p.halo}`,
            },
          ]}
        >
          {p.categoria ? (
            <Icone nome={iconeDaCategoria[p.categoria]} cor={p.par.texto} tamanho={15} peso="bold" />
          ) : (
            <Text style={[estilos.numero, { color: p.par.texto }]}>{p.texto}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  pino: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  numero: { fontFamily: fontes.semi, fontSize: 12.5 },
});
