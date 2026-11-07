import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartaoOcorrencia } from '../componentes/CartaoOcorrencia';
import { Icone, type NomeIcone } from '../componentes/icones';
import { Mapa } from '../componentes/Mapa';
import { MapaEsquematico } from '../componentes/MapaEsquematico';
import { fontes, useEstilos, useTema, type Tema } from '../componentes/tema';
import { BotaoRedondo, Carregando, Chip, Mensagem, ROTULO_CURTO_STATUS } from '../componentes/ui';
import { useAmbiente, useAvisos, useOcorrencias, useUsuario } from '../contexto/ambiente';
import { filtrarOcorrencias, type Filtro } from '../domain/lista';
import { CATEGORIAS, ROTULO_STATUS, STATUS } from '../domain/ocorrencia';
import { resolvidasPorMes, textoComparacao } from './resumoMensal';

/** Tela inicial: mapa do bairro, números do mês, atalho para registrar e a lista com filtros. */
export function Lista() {
  const { autenticacao, agora } = useAmbiente();
  const usuario = useUsuario();
  const ocorrencias = useOcorrencias();
  const avisos = useAvisos();
  const t = useTema();
  const e = useEstilos(criarEstilos);
  const { registrada } = useLocalSearchParams<{ registrada?: string }>();
  const [filtro, setFiltro] = useState<Filtro>({});
  const [verMapa, setVerMapa] = useState(false);

  const visiveis = useMemo(
    () => filtrarOcorrencias(ocorrencias ?? [], filtro, { moderador: usuario.moderador }),
    [ocorrencias, filtro, usuario.moderador],
  );
  const todas = useMemo(() => filtrarOcorrencias(ocorrencias ?? [], {}, { moderador: usuario.moderador }), [ocorrencias, usuario.moderador]);
  const resolvidas = todas.filter((o) => o.status === 'resolvida').length;
  const abertas = todas.length - resolvidas;
  const mes = useMemo(() => resolvidasPorMes(todas, agora()), [todas, agora]);
  const naoLidos = avisos.filter((a) => !a.lido).length;
  const comFiltro = !!(filtro.categoria || filtro.status);

  if (!ocorrencias) return <Carregando />;

  const abrir = (id: string) => router.push(`/ocorrencia/${id}`);
  const maiorMes = Math.max(1, ...mes.contagens);
  const comparacao = textoComparacao(mes);
  const [variacao, ...restoComparacao] = comparacao.split(' ');
  const destacarVariacao = mes.atual !== mes.anterior;

  const cabecalho = (
    <View style={e.cabecalho}>
      <View style={e.topo}>
        <View style={{ flex: 1 }}>
          <View style={e.lugar}>
            <Icone nome="local" cor={t.cores.suave} tamanho={14} peso="bold" />
            <Text style={e.textoLugar}>Vila Nova, Blumenau</Text>
          </View>
          <Text accessibilityRole="header" style={e.titulo}>
            Ocorrências do bairro
          </Text>
        </View>
        <BotaoRedondo
          icone="aviso"
          rotulo={naoLidos > 0 ? `Avisos, ${naoLidos} não ${naoLidos === 1 ? 'lido' : 'lidos'}` : 'Avisos'}
          aoPressionar={() => router.push('/avisos')}
        >
          {naoLidos > 0 ? (
            <View style={e.contador}>
              <Text style={e.textoContador}>{naoLidos}</Text>
            </View>
          ) : null}
        </BotaoRedondo>
      </View>

      {usuario.moderador ? (
        <View style={e.papel}>
          <Icone nome="associacao" cor={t.cores.texto} tamanho={14} peso="fill" />
          <Text style={e.textoPapel}>Moderação da associação</Text>
        </View>
      ) : null}

      {registrada ? <Mensagem texto="Ocorrência registrada. Obrigado!" tipo="sucesso" estilo={{ marginVertical: 0 }} /> : null}

      {!verMapa ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir mapa do bairro"
          onPress={() => setVerMapa(true)}
          style={({ pressed }) => [e.mapa, pressed && { opacity: 0.9 }]}
        >
          <MapaEsquematico ocorrencias={todas.filter((o) => o.status !== 'resolvida')} />
          <View style={e.chipMapa}>
            <View style={e.numeroMapa}>
              <Text style={e.textoNumeroMapa}>{abertas}</Text>
            </View>
            <Text style={e.textoChipMapa}>{abertas === 1 ? 'aberta no bairro' : 'abertas no bairro'}</Text>
          </View>
          <View style={e.expandir}>
            <Icone nome="expandir" cor={t.cores.fundo} tamanho={17} peso="bold" />
          </View>
        </Pressable>
      ) : null}

      <View style={e.dupla}>
        <View style={e.dados} accessible accessibilityLabel={`${mes.atual} resolvidas no mês. ${comparacao}`}>
          <View style={e.linhaDados}>
            <Icone nome="confirmado" cor={t.cores.dadosSuave} tamanho={15} peso="bold" />
            <Text style={e.rotuloDados}>Resolvidas no mês</Text>
          </View>
          <View style={e.numeroDados}>
            <Text style={e.numeroGrande}>{mes.atual}</Text>
            <View style={e.barras}>
              {mes.contagens.map((n, i) => (
                <View
                  key={i}
                  style={[
                    e.barra,
                    { height: 6 + (38 * n) / maiorMes },
                    i === mes.contagens.length - 1 && { backgroundColor: t.cores.destaque },
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={e.rodapeDados} numberOfLines={2}>
            {destacarVariacao ? (
              <>
                <Text style={e.variacao}>{variacao}</Text> {restoComparacao.join(' ')}
              </>
            ) : (
              comparacao
            )}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Registrar problema"
          onPress={() => router.push('/nova')}
          style={({ pressed }) => [e.registrar, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
        >
          <View style={e.mais}>
            <Icone nome="mais" cor={t.cores.destaque} tamanho={20} peso="bold" />
          </View>
          <Text style={e.textoRegistrar}>Registrar problema</Text>
        </Pressable>
      </View>

      <View style={[e.segmento, e.segmentoInicio, verMapa && e.segmentoFim]}>
        <Text accessibilityRole="header" style={e.tituloWidget}>
          {verMapa ? 'No mapa' : 'Registros do bairro'}
        </Text>
        <Text style={e.resumo}>
          {abertas} em aberto · {resolvidas} resolvidas
        </Text>
        <View style={e.faixa}>
          {CATEGORIAS.map((c) => (
            <Chip
              key={c.id}
              texto={c.rotulo}
              rotulo={`Filtrar por ${c.rotulo}`}
              compacto
              selecionado={filtro.categoria === c.id}
              aoPressionar={() => setFiltro((f) => ({ ...f, categoria: f.categoria === c.id ? undefined : c.id }))}
            />
          ))}
        </View>
        <View style={e.faixa}>
          {STATUS.map((s) => (
            <Chip
              key={s}
              texto={ROTULO_CURTO_STATUS[s]}
              rotulo={`Filtrar por ${ROTULO_STATUS[s]}`}
              compacto
              selecionado={filtro.status === s}
              aoPressionar={() => setFiltro((f) => ({ ...f, status: f.status === s ? undefined : s }))}
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={e.tela} edges={['top']}>
      <FlatList
        data={verMapa ? [] : visiveis}
        keyExtractor={(o) => o.id}
        contentContainerStyle={e.conteudo}
        ListHeaderComponent={cabecalho}
        renderItem={({ item, index }) => (
          <View style={[e.segmento, index === visiveis.length - 1 && e.segmentoFim]}>
            <CartaoOcorrencia ocorrencia={item} aoPressionar={() => abrir(item.id)} divisoria={index > 0} />
          </View>
        )}
        ListEmptyComponent={
          verMapa ? undefined : (
            <View style={[e.segmento, e.segmentoFim, e.vazio]}>
              <View style={e.iconeVazio}>
                <Icone nome="local" cor={t.cores.texto} tamanho={26} peso="bold" />
              </View>
              <Text style={e.textoVazio}>
                {comFiltro ? 'Nenhuma ocorrência com esses filtros.' : 'Nenhuma ocorrência por aqui ainda.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          verMapa ? (
            <View style={{ marginTop: 12 }}>
              <Mapa ocorrencias={visiveis} aoAbrir={abrir} />
            </View>
          ) : undefined
        }
      />

      <View style={e.areaNavegacao} pointerEvents="box-none">
        <View style={e.navegacao}>
          <ItemNavegacao icone="inicio" texto="Início" rotulo="Início" ativo={!verMapa} aoPressionar={() => setVerMapa(false)} />
          <ItemNavegacao icone="mapa" texto="Mapa" rotulo="Ver no mapa" ativo={verMapa} aoPressionar={() => setVerMapa(true)} />
          <ItemNavegacao icone="sair" texto="Sair" rotulo="Sair" ativo={false} aoPressionar={() => autenticacao.sair()} />
        </View>
      </View>
    </SafeAreaView>
  );
}

type ItemProps = { icone: NomeIcone; texto: string; rotulo: string; ativo: boolean; aoPressionar: () => void };

/** Item da barra flutuante: o ativo vira uma pílula clara com o nome; os outros mostram só o ícone. */
function ItemNavegacao({ icone, texto, rotulo, ativo, aoPressionar }: ItemProps) {
  const t = useTema();
  const e = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: ativo }}
      onPress={aoPressionar}
      style={({ pressed }) => [e.item, ativo && e.itemAtivo, pressed && { opacity: 0.8 }]}
    >
      <Icone nome={icone} cor={ativo ? t.cores.sobreDestaque : t.cores.navegacaoInativa} tamanho={20} peso="bold" />
      {ativo ? <Text style={e.textoItem}>{texto}</Text> : null}
    </Pressable>
  );
}

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: c.fundo },
    conteudo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
    cabecalho: { gap: 12 },
    topo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
    lugar: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
    textoLugar: { color: c.suave, fontFamily: fontes.media, fontSize: 13 },
    titulo: { color: c.texto, fontFamily: fontes.titulo, fontSize: 30, lineHeight: 32, letterSpacing: -0.8 },
    contador: {
      position: 'absolute',
      top: 2,
      right: 0,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 4,
      backgroundColor: c.destaque,
      borderWidth: 2,
      borderColor: c.cartao,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textoContador: { color: c.sobreDestaque, fontFamily: fontes.negrito, fontSize: 10.5 },
    papel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: c.cartao,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    textoPapel: { color: c.texto, fontFamily: fontes.semi, fontSize: 13 },
    mapa: { height: 190, borderRadius: 28, overflow: 'hidden' },
    chipMapa: {
      position: 'absolute',
      left: 12,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 7,
      paddingLeft: 8,
      paddingRight: 12,
      borderRadius: 18,
      backgroundColor: c.vidro,
    },
    numeroMapa: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 4, backgroundColor: c.destaque, alignItems: 'center', justifyContent: 'center' },
    textoNumeroMapa: { color: c.sobreDestaque, fontFamily: fontes.semi, fontSize: 11 },
    textoChipMapa: { color: c.texto, fontFamily: fontes.semi, fontSize: 13 },
    expandir: {
      position: 'absolute',
      right: 12,
      bottom: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.texto,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dupla: { flexDirection: 'row', gap: 12 },
    dados: { flex: 1, minHeight: 150, padding: 16, borderRadius: 26, backgroundColor: c.dados, justifyContent: 'space-between', gap: 8 },
    linhaDados: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rotuloDados: { color: c.dadosSuave, fontFamily: fontes.media, fontSize: 12.5, flexShrink: 1 },
    numeroDados: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    numeroGrande: { color: c.dadosTexto, fontFamily: fontes.titulo, fontSize: 44, lineHeight: 44, letterSpacing: -1 },
    barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 44 },
    barra: { width: 9, borderRadius: 3, backgroundColor: c.dadosBarra },
    rodapeDados: { color: c.dadosSuave, fontFamily: fontes.regular, fontSize: 12 },
    variacao: { color: c.destaque, fontFamily: fontes.semi },
    registrar: { flex: 1, minHeight: 150, padding: 16, borderRadius: 26, backgroundColor: c.destaque, justifyContent: 'space-between', gap: 12 },
    mais: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.sobreDestaque, alignItems: 'center', justifyContent: 'center' },
    textoRegistrar: { color: c.sobreDestaque, fontFamily: fontes.titulo, fontSize: 20, lineHeight: 22, letterSpacing: -0.3 },
    segmento: { backgroundColor: c.cartao, paddingHorizontal: 16 },
    segmentoInicio: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16, paddingBottom: 6, marginHorizontal: 0 },
    segmentoFim: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26, paddingBottom: 6 },
    tituloWidget: { color: c.texto, fontFamily: fontes.titulo, fontSize: 17, letterSpacing: -0.2 },
    resumo: { color: c.suave, fontFamily: fontes.regular, fontSize: 13, marginTop: 2 },
    faixa: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    vazio: { alignItems: 'center', paddingVertical: 28, gap: 12 },
    iconeVazio: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo },
    textoVazio: { textAlign: 'center', color: c.suave, fontFamily: fontes.media, fontSize: 15 },
    areaNavegacao: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
    navegacao: {
      flexDirection: 'row',
      gap: 4,
      padding: 6,
      borderRadius: 32,
      backgroundColor: c.navegacao,
      boxShadow: '0 12px 30px rgba(22,22,22,0.25)',
    },
    item: { minWidth: 48, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
    itemAtivo: { backgroundColor: c.navegacaoAtiva, paddingHorizontal: 16 },
    textoItem: { color: c.sobreDestaque, fontFamily: fontes.semi, fontSize: 14 },
  });
