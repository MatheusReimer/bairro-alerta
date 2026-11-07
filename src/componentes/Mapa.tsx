import { Camera, Map as MapaBase, Marker, NativeUserLocation, type InitialViewState } from '@maplibre/maplibre-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ROTULO_STATUS, rotuloCategoria, type Ocorrencia } from '../domain/ocorrencia';
import { Icone, iconeDaCategoria } from './icones';
import { posicionar } from './MapaEsquematico';
import { comAlfa, fontes, useEstilos, useTema, type Tema } from './tema';
import { textoApoios } from './ui';

// Bairro Vila Nova, Blumenau (SC): centro padrão quando ainda não há ocorrências.
const CENTRO_PADRAO: [number, number] = [-49.0943, -26.9055];

/**
 * Mapas vetoriais do OpenFreeMap (dados do OpenStreetMap): gratuitos, sem chave e liberados para apps.
 * A atribuição é obrigatória e aparece no canto do mapa (ver ATRIBUICAO).
 */
export const ESTILO_CLARO = 'https://tiles.openfreemap.org/styles/positron';
export const ESTILO_ESCURO = 'https://tiles.openfreemap.org/styles/dark';
export const ATRIBUICAO = 'OpenFreeMap © OpenMapTiles © OpenStreetMap';
const URL_DIREITOS_OSM = 'https://www.openstreetmap.org/copyright';

/** Enquadramento inicial: o bairro quando não há pontos, o ponto quando há um só, todos os pontos quando há vários. */
export function vistaInicial(ocorrencias: readonly Ocorrencia[]): InitialViewState {
  if (ocorrencias.length === 0) return { center: CENTRO_PADRAO, zoom: 15 };
  const lngs = ocorrencias.map((o) => o.local.longitude);
  const lats = ocorrencias.map((o) => o.local.latitude);
  const [oeste, sul, leste, norte] = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
  if (leste - oeste < 1e-6 && norte - sul < 1e-6) return { center: [oeste, sul], zoom: 16 };
  return { bounds: [oeste, sul, leste, norte], padding: { top: 60, right: 60, bottom: 110, left: 60 } };
}

type Props = { ocorrencias: Ocorrencia[]; aoAbrir: (id: string) => void };

export function Mapa({ ocorrencias, aoAbrir }: Props) {
  const t = useTema();
  const e = useEstilos(criarEstilos);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  // Mesmo critério de cor do mapa ilustrado: o mais apoiado em lima, os resolvidos apagados.
  const niveis = new Map(posicionar(ocorrencias).map((p) => [p.o.id, p.nivel]));
  const selecionada = ocorrencias.find((o) => o.id === selecionadaId);

  return (
    <View style={e.caixa}>
      <MapaBase
        style={StyleSheet.absoluteFill}
        mapStyle={t.escuro ? ESTILO_ESCURO : ESTILO_CLARO}
        attribution={false}
        logo={false}
        compass={false}
        touchPitch={false}
        accessibilityLabel="Mapa das ocorrências"
      >
        <Camera initialViewState={vistaInicial(ocorrencias)} maxZoom={18} />
        <NativeUserLocation />
        {ocorrencias.map((o) => {
          const par = t.pinos[niveis.get(o.id) ?? 'padrao'];
          const ativa = o.id === selecionadaId;
          return (
            <Marker
              key={o.id}
              id={o.id}
              testID="marcador"
              lngLat={[o.local.longitude, o.local.latitude]}
              anchor="center"
              onPress={() => setSelecionadaId(o.id)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${rotuloCategoria(o.categoria)}, ${ROTULO_STATUS[o.status]}, ${textoApoios(o.apoios)}`}
              accessibilityState={{ selected: ativa }}
            >
              <View
                style={[
                  e.pino,
                  {
                    backgroundColor: par.fundo,
                    boxShadow: `0 0 0 ${ativa ? 7 : 5}px ${comAlfa(par.fundo, ativa ? 0.4 : 0.25)}`,
                  },
                ]}
              >
                {o.apoios > 0 ? (
                  <Text style={[e.numero, { color: par.texto }]}>{o.apoios}</Text>
                ) : (
                  <Icone nome={iconeDaCategoria[o.categoria]} cor={par.texto} tamanho={15} peso="bold" />
                )}
              </View>
            </Marker>
          );
        })}
      </MapaBase>

      {selecionada ? (
        <View style={e.cartao}>
          <Pressable
            style={e.cartaoConteudo}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${rotuloCategoria(selecionada.categoria)}, ${ROTULO_STATUS[selecionada.status]}`}
            onPress={() => aoAbrir(selecionada.id)}
          >
            <View style={e.icone}>
              <Icone nome={iconeDaCategoria[selecionada.categoria]} cor={t.cores.texto} tamanho={20} peso="bold" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={e.titulo}>{rotuloCategoria(selecionada.categoria)}</Text>
              <Text style={e.meta}>
                {ROTULO_STATUS[selecionada.status]} · {textoApoios(selecionada.apoios)}
              </Text>
              <Text style={e.acao}>Toque para abrir</Text>
            </View>
          </Pressable>
          <Pressable
            style={e.fechar}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            hitSlop={8}
            onPress={() => setSelecionadaId(null)}
          >
            <Icone nome="fechar" cor={t.cores.suave} tamanho={18} peso="bold" />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={e.atribuicao}
        accessibilityRole="link"
        accessibilityLabel="Créditos do mapa: OpenFreeMap, OpenMapTiles e colaboradores do OpenStreetMap"
        onPress={() => Linking.openURL(URL_DIREITOS_OSM)}
      >
        <Text style={e.textoAtribuicao}>{ATRIBUICAO}</Text>
      </Pressable>
    </View>
  );
}

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    caixa: { height: 460, borderRadius: 26, overflow: 'hidden', backgroundColor: c.cartao },
    pino: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', margin: 8 },
    numero: { fontFamily: fontes.semi, fontSize: 12.5 },
    cartao: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 30,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      backgroundColor: c.vidro,
      borderWidth: 1,
      borderColor: c.borda,
    },
    cartaoConteudo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    icone: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo },
    titulo: { fontFamily: fontes.negrito, fontSize: 15, color: c.texto },
    meta: { fontFamily: fontes.regular, fontSize: 13, color: c.suave },
    acao: { fontFamily: fontes.semi, fontSize: 12.5, color: c.texto },
    fechar: { padding: 12 },
    atribuicao: {
      position: 'absolute',
      right: 8,
      bottom: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.vidro,
    },
    textoAtribuicao: { fontFamily: fontes.regular, fontSize: 10, color: c.suave },
  });
