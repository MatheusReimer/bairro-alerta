import MapView, { Callout, Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

import { ROTULO_STATUS, rotuloCategoria, type Ocorrencia } from '../domain/ocorrencia';
import { cores, corDoStatus } from './ui';

// Bairro Vila Nova, Blumenau (SC): centro padrão quando ainda não há ocorrências.
const CENTRO_PADRAO = { latitude: -26.9055, longitude: -49.0943 };

type Props = { ocorrencias: Ocorrencia[]; aoAbrir: (id: string) => void };

export function Mapa({ ocorrencias, aoAbrir }: Props) {
  const centro =
    ocorrencias.length === 0
      ? CENTRO_PADRAO
      : {
          latitude: ocorrencias.reduce((s, o) => s + o.local.latitude, 0) / ocorrencias.length,
          longitude: ocorrencias.reduce((s, o) => s + o.local.longitude, 0) / ocorrencias.length,
        };

  return (
    <View style={estilos.caixa}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...centro, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
        showsUserLocation
        accessibilityLabel="Mapa das ocorrências"
      >
        {ocorrencias.map((o) => (
          <Marker key={o.id} testID="marcador" coordinate={o.local} pinColor={corDoStatus[o.status]}>
            <Callout onPress={() => aoAbrir(o.id)}>
              <View style={{ maxWidth: 220 }}>
                <Text style={{ fontWeight: '700' }}>{rotuloCategoria(o.categoria)}</Text>
                <Text>{ROTULO_STATUS[o.status]}</Text>
                <Text style={{ color: cores.azul }}>Toque para abrir</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { flex: 1, minHeight: 360, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: cores.borda },
});
