import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ROTULO_STATUS, rotuloCategoria, type Ocorrencia } from '../domain/ocorrencia';
import { cores } from './ui';

type Props = { ocorrencias: Ocorrencia[]; aoAbrir: (id: string) => void };

/**
 * No navegador o react-native-maps não funciona. Esta versão lista os pontos com link para o
 * OpenStreetMap; o mapa interativo é usado no celular.
 */
export function Mapa({ ocorrencias, aoAbrir }: Props) {
  return (
    <View style={estilos.caixa}>
      <Text style={estilos.aviso}>O mapa interativo está disponível no app do celular.</Text>
      {ocorrencias.map((o) => (
        <View key={o.id} testID="marcador" style={estilos.ponto}>
          <Pressable accessibilityRole="button" onPress={() => aoAbrir(o.id)}>
            <Text style={{ fontWeight: '700' }}>
              📍 {rotuloCategoria(o.categoria)} ({ROTULO_STATUS[o.status]})
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              Linking.openURL(
                `https://www.openstreetmap.org/?mlat=${o.local.latitude}&mlon=${o.local.longitude}#map=18/${o.local.latitude}/${o.local.longitude}`,
              )
            }
          >
            <Text style={{ color: cores.azul }}>Ver no OpenStreetMap</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { backgroundColor: cores.branco, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: cores.borda },
  aviso: { color: cores.cinza, marginBottom: 8 },
  ponto: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: cores.borda, gap: 4 },
});
