import MapView, { Callout, Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

import { ROTULO_STATUS, rotuloCategoria, type Ocorrencia } from '../domain/ocorrencia';
import { Icone, iconeDaCategoria } from './icones';
import { posicionar } from './MapaEsquematico';
import { comAlfa, fontes, useEstilos, useTema, type CoresMapa, type Tema } from './tema';

// Bairro Vila Nova, Blumenau (SC): centro padrão quando ainda não há ocorrências.
const CENTRO_PADRAO = { latitude: -26.9055, longitude: -49.0943 };

/** Estilo do Google Maps (Android) nas cores do tema. No iOS o mapa segue o tema pelo userInterfaceStyle. */
function estiloMapa(m: CoresMapa, escuro: boolean) {
  return [
    { elementType: 'geometry', stylers: [{ color: m.terra }] },
    { elementType: 'labels.text.fill', stylers: [{ color: escuro ? '#8F8F8A' : '#696965' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: m.terra }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: m.rua }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: m.agua }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: m.parque }] },
  ];
}

type Props = { ocorrencias: Ocorrencia[]; aoAbrir: (id: string) => void };

export function Mapa({ ocorrencias, aoAbrir }: Props) {
  const t = useTema();
  const e = useEstilos(criarEstilos);
  const centro =
    ocorrencias.length === 0
      ? CENTRO_PADRAO
      : {
          latitude: ocorrencias.reduce((s, o) => s + o.local.latitude, 0) / ocorrencias.length,
          longitude: ocorrencias.reduce((s, o) => s + o.local.longitude, 0) / ocorrencias.length,
        };
  // Mesmo critério de cor do mapa ilustrado: o mais apoiado em lima, os resolvidos apagados.
  const niveis = new Map(posicionar(ocorrencias).map((p) => [p.o.id, p.nivel]));

  return (
    <View style={e.caixa}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...centro, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
        showsUserLocation
        userInterfaceStyle={t.escuro ? 'dark' : 'light'}
        customMapStyle={estiloMapa(t.mapa, t.escuro)}
        accessibilityLabel="Mapa das ocorrências"
      >
        {ocorrencias.map((o) => {
          const par = t.pinos[niveis.get(o.id) ?? 'padrao'];
          return (
            <Marker key={o.id} testID="marcador" coordinate={o.local} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={[e.pino, { backgroundColor: par.fundo, boxShadow: `0 0 0 5px ${comAlfa(par.fundo, 0.25)}` }]}>
                {o.apoios > 0 ? (
                  <Text style={[e.numero, { color: par.texto }]}>{o.apoios}</Text>
                ) : (
                  <Icone nome={iconeDaCategoria[o.categoria]} cor={par.texto} tamanho={15} peso="bold" />
                )}
              </View>
              <Callout onPress={() => aoAbrir(o.id)}>
                <View style={{ maxWidth: 220 }}>
                  <Text style={{ fontFamily: fontes.negrito }}>{rotuloCategoria(o.categoria)}</Text>
                  <Text style={{ fontFamily: fontes.regular }}>{ROTULO_STATUS[o.status]}</Text>
                  <Text style={{ fontFamily: fontes.semi }}>Toque para abrir</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    caixa: { height: 460, borderRadius: 26, overflow: 'hidden', backgroundColor: c.cartao },
    pino: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', margin: 6 },
    numero: { fontFamily: fontes.semi, fontSize: 12.5 },
  });
