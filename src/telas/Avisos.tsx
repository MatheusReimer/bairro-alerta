import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { cores, dataCurta } from '../componentes/ui';
import { useAmbiente, useAvisos, useUsuario } from '../contexto/ambiente';

/** Central de avisos: mudanças de status nas ocorrências que o morador registrou ou apoiou (história #9). */
export function Avisos() {
  const { repositorio } = useAmbiente();
  const { uid } = useUsuario();
  const avisos = useAvisos();

  return (
    <FlatList
      data={avisos}
      keyExtractor={(a) => a.id}
      contentContainerStyle={estilos.tela}
      ListEmptyComponent={<Text style={estilos.vazio}>Nenhum aviso por enquanto.</Text>}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.titulo}. ${item.corpo}${item.lido ? '' : ' (não lido)'}`}
          onPress={async () => {
            if (!item.lido) await repositorio.marcarAvisoLido(uid, item.id).catch(() => undefined);
            router.push(`/ocorrencia/${item.ocorrenciaId}`);
          }}
          style={[estilos.aviso, !item.lido && estilos.naoLido]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[estilos.titulo, !item.lido && { fontWeight: '700' }]}>{item.titulo}</Text>
            <Text style={estilos.corpo}>{item.corpo}</Text>
          </View>
          <Text style={estilos.data}>{dataCurta(item.criadoEm)}</Text>
        </Pressable>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  tela: { padding: 16, backgroundColor: cores.fundo, flexGrow: 1 },
  vazio: { textAlign: 'center', color: cores.cinza, marginTop: 40, fontSize: 15 },
  aviso: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  naoLido: { borderLeftWidth: 4, borderLeftColor: cores.azul },
  titulo: { color: cores.texto, fontSize: 15 },
  corpo: { color: cores.cinza, marginTop: 2 },
  data: { color: cores.cinza, fontSize: 12 },
});
