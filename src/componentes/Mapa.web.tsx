import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ROTULO_STATUS, rotuloCategoria, type Ocorrencia } from '../domain/ocorrencia';
import { Icone, iconeDaCategoria } from './icones';
import { MapaEsquematico } from './MapaEsquematico';
import { fontes, useEstilos, useTema, type Tema } from './tema';
import { textoApoios } from './ui';

type Props = { ocorrencias: Ocorrencia[]; aoAbrir: (id: string) => void };

/**
 * No navegador o react-native-maps não funciona. Esta versão mostra o mapa ilustrado com os pontos e uma lista com
 * link para o OpenStreetMap; o mapa interativo é usado no app do celular.
 */
export function Mapa({ ocorrencias, aoAbrir }: Props) {
  const t = useTema();
  const e = useEstilos(criarEstilos);
  return (
    <View style={e.caixa}>
      <View style={e.ilustracao}>
        <MapaEsquematico ocorrencias={ocorrencias} />
      </View>
      <View style={e.aviso}>
        <Icone nome="mapa" cor={t.cores.suave} tamanho={18} peso="bold" />
        <Text style={e.textoAviso}>O mapa interativo está disponível no app do celular.</Text>
      </View>
      {ocorrencias.map((o) => (
        <View key={o.id} testID="marcador" style={e.ponto}>
          <View style={e.icone}>
            <Icone nome={iconeDaCategoria[o.categoria]} cor={t.cores.texto} tamanho={20} peso="bold" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Pressable accessibilityRole="button" onPress={() => aoAbrir(o.id)}>
              <Text style={e.titulo}>
                {rotuloCategoria(o.categoria)} ({ROTULO_STATUS[o.status]})
              </Text>
            </Pressable>
            <Text style={e.meta}>{textoApoios(o.apoios)}</Text>
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              Linking.openURL(
                `https://www.openstreetmap.org/?mlat=${o.local.latitude}&mlon=${o.local.longitude}#map=18/${o.local.latitude}/${o.local.longitude}`,
              )
            }
            style={e.link}
          >
            <Text style={e.textoLink}>Ver no OpenStreetMap</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    caixa: { backgroundColor: c.cartao, borderRadius: 26, padding: 8, paddingBottom: 4 },
    ilustracao: { height: 260, borderRadius: 20, overflow: 'hidden' },
    aviso: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 12 },
    textoAviso: { color: c.suave, fontFamily: fontes.regular, fontSize: 13, flex: 1 },
    ponto: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: c.linha },
    icone: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo },
    titulo: { color: c.texto, fontFamily: fontes.semi, fontSize: 14 },
    meta: { color: c.suave, fontFamily: fontes.regular, fontSize: 12.5 },
    link: { paddingVertical: 6, maxWidth: 110 },
    textoLink: { color: c.destaqueTexto, fontFamily: fontes.semi, fontSize: 13, textAlign: 'right' },
  });
