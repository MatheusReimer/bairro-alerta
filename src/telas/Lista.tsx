import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartaoOcorrencia } from '../componentes/CartaoOcorrencia';
import { Mapa } from '../componentes/Mapa';
import { Botao, Carregando, Chip, cores, Mensagem } from '../componentes/ui';
import { useAmbiente, useAvisos, useOcorrencias, useUsuario } from '../contexto/ambiente';
import { filtrarOcorrencias, type Filtro } from '../domain/lista';
import { CATEGORIAS, ROTULO_STATUS, STATUS } from '../domain/ocorrencia';

export function Lista() {
  const { autenticacao } = useAmbiente();
  const usuario = useUsuario();
  const ocorrencias = useOcorrencias();
  const avisos = useAvisos();
  const { registrada } = useLocalSearchParams<{ registrada?: string }>();
  const [filtro, setFiltro] = useState<Filtro>({});
  const [verMapa, setVerMapa] = useState(false);

  const visiveis = useMemo(
    () => filtrarOcorrencias(ocorrencias ?? [], filtro, { moderador: usuario.moderador }),
    [ocorrencias, filtro, usuario.moderador],
  );
  const naoLidos = avisos.filter((a) => !a.lido).length;
  const comFiltro = !!(filtro.categoria || filtro.status);

  if (!ocorrencias) return <Carregando />;

  const abrir = (id: string) => router.push(`/ocorrencia/${id}`);

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <View style={estilos.cabecalho}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={estilos.titulo}>
            Ocorrências do bairro
          </Text>
          {usuario.moderador ? <Text style={estilos.papel}>Moderação da associação</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={naoLidos > 0 ? `Avisos, ${naoLidos} não ${naoLidos === 1 ? 'lido' : 'lidos'}` : 'Avisos'}
          onPress={() => router.push('/avisos')}
          style={estilos.iconeTopo}
        >
          <Text style={estilos.textoTopo}>🔔{naoLidos > 0 ? ` ${naoLidos}` : ''}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Sair" onPress={() => autenticacao.sair()} style={estilos.iconeTopo}>
          <Text style={estilos.textoTopo}>Sair</Text>
        </Pressable>
      </View>

      <View style={estilos.filtros}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIAS.map((c) => (
            <Chip
              key={c.id}
              texto={`${c.icone} ${c.rotulo}`}
              rotulo={`Filtrar por ${c.rotulo}`}
              selecionado={filtro.categoria === c.id}
              aoPressionar={() => setFiltro((f) => ({ ...f, categoria: f.categoria === c.id ? undefined : c.id }))}
            />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS.map((s) => (
            <Chip
              key={s}
              texto={ROTULO_STATUS[s]}
              rotulo={`Filtrar por ${ROTULO_STATUS[s]}`}
              selecionado={filtro.status === s}
              aoPressionar={() => setFiltro((f) => ({ ...f, status: f.status === s ? undefined : s }))}
            />
          ))}
        </ScrollView>
        <Botao
          titulo={verMapa ? 'Ver em lista' : 'Ver no mapa'}
          variante="secundario"
          aoPressionar={() => setVerMapa((v) => !v)}
        />
      </View>

      {registrada ? <View style={{ paddingHorizontal: 16 }}><Mensagem texto="Ocorrência registrada. Obrigado!" tipo="sucesso" /></View> : null}

      {verMapa ? (
        <View style={estilos.conteudo}>
          <Mapa ocorrencias={visiveis} aoAbrir={abrir} />
        </View>
      ) : (
        <FlatList
          data={visiveis}
          keyExtractor={(o) => o.id}
          contentContainerStyle={estilos.conteudo}
          renderItem={({ item }) => <CartaoOcorrencia ocorrencia={item} aoPressionar={() => abrir(item.id)} />}
          ListEmptyComponent={
            <Text style={estilos.vazio}>
              {comFiltro ? 'Nenhuma ocorrência com esses filtros.' : 'Nenhuma ocorrência por aqui ainda.'}
            </Text>
          }
        />
      )}

      <View style={estilos.acao}>
        <Botao titulo="Registrar problema" aoPressionar={() => router.push('/nova')} />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { flexDirection: 'row', alignItems: 'center', backgroundColor: cores.azul, paddingHorizontal: 16, paddingVertical: 12 },
  titulo: { color: cores.branco, fontSize: 20, fontWeight: '700' },
  papel: { color: cores.azulClaro, fontSize: 13 },
  iconeTopo: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  textoTopo: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  filtros: { paddingHorizontal: 16, paddingTop: 12, gap: 4 },
  conteudo: { padding: 16, paddingBottom: 96, flexGrow: 1 },
  vazio: { textAlign: 'center', color: cores.cinza, marginTop: 40, fontSize: 15 },
  acao: { position: 'absolute', left: 16, right: 16, bottom: 24 },
});
