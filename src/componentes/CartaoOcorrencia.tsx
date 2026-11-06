import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROTULO_STATUS, rotuloCategoria, type Ocorrencia } from '../domain/ocorrencia';
import { cores, corDoStatus, Selo, textoApoios } from './ui';

type Props = { ocorrencia: Ocorrencia; aoPressionar: () => void; extra?: string };

/** Cartão da lista. Não mostra o autor (LGPD). */
export function CartaoOcorrencia({ ocorrencia: o, aoPressionar, extra }: Props) {
  const categoria = rotuloCategoria(o.categoria);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${categoria}: ${o.descricao || 'sem descrição'}`}
      onPress={aoPressionar}
      style={({ pressed }) => [estilos.cartao, pressed && { opacity: 0.85 }]}
    >
      <View style={estilos.topo}>
        <Text style={estilos.categoria}>{categoria}</Text>
        <Selo texto={ROTULO_STATUS[o.status]} cor={corDoStatus[o.status]} />
      </View>
      {o.descricao ? <Text style={estilos.descricao}>{o.descricao}</Text> : null}
      <View style={estilos.rodape}>
        <Text style={estilos.meta}>{textoApoios(o.apoios)}</Text>
        {extra ? <Text style={estilos.meta}>{extra}</Text> : null}
        {o.oculta ? <Selo texto="Oculta" cor={cores.cinza} /> : null}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  categoria: { fontSize: 16, fontWeight: '700', color: cores.texto },
  descricao: { marginTop: 6, color: cores.texto, fontSize: 15 },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  meta: { color: cores.cinza, fontSize: 13 },
});
