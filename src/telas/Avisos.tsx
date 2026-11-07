import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icone } from '../componentes/icones';
import { fontes, useEstilos, useTema, type Tema } from '../componentes/tema';
import { BotaoRedondo, dataCurta } from '../componentes/ui';
import { voltar } from '../componentes/voltar';
import { useAmbiente, useAvisos, useUsuario } from '../contexto/ambiente';

/** Central de avisos: mudanças de status nas ocorrências que o morador registrou ou apoiou (história #9). */
export function Avisos() {
  const { repositorio } = useAmbiente();
  const { uid } = useUsuario();
  const avisos = useAvisos();
  const t = useTema();
  const e = useEstilos(criarEstilos);

  return (
    <SafeAreaView style={e.tela} edges={['top']}>
      <FlatList
        data={avisos}
        keyExtractor={(a) => a.id}
        contentContainerStyle={e.conteudo}
        ListHeaderComponent={
          <View style={e.cabecalho}>
            <BotaoRedondo icone="voltar" rotulo="Voltar" tamanho={44} aoPressionar={voltar} />
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" style={e.titulo}>
                Avisos
              </Text>
              <Text style={e.subtitulo}>Registros que você fez ou apoiou</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[e.segmento, e.inicio, e.fim, e.vazio]}>
            <View style={e.iconeVazio}>
              <Icone nome="aviso" cor={t.cores.texto} tamanho={26} peso="bold" />
            </View>
            <Text style={e.textoVazio}>Nenhum aviso por enquanto.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[e.segmento, index === 0 && e.inicio, index === avisos.length - 1 && e.fim]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.titulo}. ${item.corpo}${item.lido ? '' : ' (não lido)'}`}
              onPress={async () => {
                if (!item.lido) await repositorio.marcarAvisoLido(uid, item.id).catch(() => undefined);
                router.push(`/ocorrencia/${item.ocorrenciaId}`);
              }}
              style={({ pressed }) => [e.aviso, index > 0 && e.divisoria, pressed && { opacity: 0.7 }]}
            >
              <View style={[e.icone, !item.lido && e.iconeNaoLido]}>
                <Icone nome="associacao" cor={item.lido ? t.cores.texto : t.cores.sobreDestaque} tamanho={19} peso="bold" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[e.tituloAviso, !item.lido && { fontFamily: fontes.negrito }]}>{item.titulo}</Text>
                <Text style={e.corpo}>{item.corpo}</Text>
                <Text style={e.data}>{dataCurta(item.criadoEm)}</Text>
              </View>
              {!item.lido ? <Text style={e.novo}>Novo</Text> : null}
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: c.fundo },
    conteudo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
    cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    titulo: { color: c.texto, fontFamily: fontes.titulo, fontSize: 28, lineHeight: 30, letterSpacing: -0.6 },
    subtitulo: { color: c.suave, fontFamily: fontes.regular, fontSize: 13, marginTop: 2 },
    segmento: { backgroundColor: c.cartao, paddingHorizontal: 16 },
    inicio: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 4 },
    fim: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26, paddingBottom: 4 },
    vazio: { alignItems: 'center', paddingVertical: 28, gap: 12 },
    iconeVazio: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo },
    textoVazio: { textAlign: 'center', color: c.suave, fontFamily: fontes.media, fontSize: 15 },
    aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
    divisoria: { borderTopWidth: 1, borderTopColor: c.linha },
    icone: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo },
    iconeNaoLido: { backgroundColor: c.destaque },
    tituloAviso: { color: c.texto, fontSize: 15, fontFamily: fontes.semi },
    corpo: { color: c.suave, fontFamily: fontes.regular, fontSize: 14, marginTop: 2, lineHeight: 19 },
    data: { color: c.suave, fontFamily: fontes.regular, fontSize: 12, marginTop: 6 },
    novo: {
      color: c.sobreDestaque,
      backgroundColor: c.destaque,
      fontFamily: fontes.semi,
      fontSize: 11.5,
      borderRadius: 10,
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
  });
