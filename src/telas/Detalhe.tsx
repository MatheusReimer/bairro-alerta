import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icone, iconeDaCategoria } from '../componentes/icones';
import { fontes, useEstilos, useTema, type Tema } from '../componentes/tema';
import { Botao, BotaoRedondo, Carregando, Mensagem, ROTULO_CURTO_STATUS, Selo, Widget, dataCurta, textoApoios } from '../componentes/ui';
import { voltar } from '../componentes/voltar';
import { useAmbiente, useOcorrencias, useUsuario } from '../contexto/ambiente';
import { proximosStatus } from '../domain/moderacao';
import { ROTULO_STATUS, rotuloCategoria, STATUS, type Status } from '../domain/ocorrencia';
import { ErroRegra } from '../domain/regras';

export function Detalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { servico, repositorio } = useAmbiente();
  const usuario = useUsuario();
  const ocorrencias = useOcorrencias();
  const t = useTema();
  const e = useEstilos(criarEstilos);
  const margem = useSafeAreaInsets();
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const oc = ocorrencias?.find((o) => o.id === id);
  const fotoPath = oc?.fotoPath;

  useEffect(() => {
    if (!fotoPath) return;
    let ativo = true;
    repositorio.urlDaFoto(fotoPath).then((url) => ativo && setFotoUrl(url), () => ativo && setFotoUrl(null));
    return () => {
      ativo = false;
    };
  }, [repositorio, fotoPath]);

  if (!ocorrencias) return <Carregando />;
  if (!oc) {
    return (
      <View style={[e.vazio, { paddingTop: margem.top + 12 }]}>
        <BotaoRedondo icone="voltar" rotulo="Voltar" tamanho={44} aoPressionar={voltar} />
        <Mensagem texto="Ocorrência não encontrada." tipo="erro" />
      </View>
    );
  }

  async function agir(acao: () => Promise<void>) {
    setErro(null);
    setOcupado(true);
    try {
      await acao();
    } catch (e) {
      setErro(e instanceof ErroRegra ? e.message : 'Não foi possível salvar. Verifique a internet e tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  const ehAutor = oc.autorId === usuario.uid;
  const jaApoiou = oc.apoiadores.includes(usuario.uid);
  const podeApoiar = !ehAutor && !jaApoiou && oc.status !== 'resolvida';
  const atual = STATUS.indexOf(oc.status);
  // O mais recente primeiro, como numa linha do tempo; o índice original diz quem fez cada passo.
  const eventos = oc.historico.map((h, i) => ({ ...h, i })).reverse();

  return (
    <ScrollView style={{ backgroundColor: t.cores.fundo }} contentContainerStyle={e.rolagem}>
      {/* A foto fica sob a barra de status, então o texto dela fica claro nos dois temas. */}
      <StatusBar style="light" />
      <View style={e.heroi}>
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={StyleSheet.absoluteFill} accessibilityLabel="Foto do problema" resizeMode="cover" />
        ) : (
          <View style={e.semFoto}>
            <Icone nome={iconeDaCategoria[oc.categoria]} cor={t.cores.dadosBarra} tamanho={96} peso="bold" />
          </View>
        )}
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1 1" pointerEvents="none">
          <Defs>
            <LinearGradient id="veu" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#161616" stopOpacity={0.35} />
              <Stop offset="0.3" stopColor="#161616" stopOpacity={0} />
              <Stop offset="0.5" stopColor="#161616" stopOpacity={0} />
              <Stop offset="1" stopColor="#161616" stopOpacity={0.82} />
            </LinearGradient>
          </Defs>
          <Rect width="1" height="1" fill="url(#veu)" />
        </Svg>
        <View style={[e.topoHeroi, { top: margem.top + 12 }]}>
          <BotaoRedondo icone="voltar" rotulo="Voltar" tamanho={44} sobreFoto aoPressionar={voltar} />
          <Selo texto={ROTULO_CURTO_STATUS[oc.status]} par={t.status[oc.status]} estilo={{ alignSelf: 'center' }} />
        </View>
        <View style={e.baseHeroi}>
          <Text style={e.metaHeroi}>Registrada em {dataCurta(oc.criadaEm)}</Text>
          <Text accessibilityRole="header" style={e.titulo}>
            {rotuloCategoria(oc.categoria)}
          </Text>
        </View>
      </View>

      <View style={e.corpo}>
        {oc.descricao ? (
          <Widget>
            <Text style={e.descricao}>{oc.descricao}</Text>
          </Widget>
        ) : null}

        <View style={e.dupla}>
          <View style={e.apoios} accessible accessibilityLabel={textoApoios(oc.apoios)}>
            <View style={e.avatares}>
              {[t.cores.destaque, '#4A4A46', '#8F8F8A'].map((cor, i) => (
                <View key={cor} style={[e.avatar, { backgroundColor: cor }, i > 0 && { marginLeft: -8 }]} />
              ))}
            </View>
            <View style={e.linhaApoios}>
              <Text style={e.numeroApoios}>{oc.apoios}</Text>
              <Text style={e.legendaApoios}>{oc.apoios === 1 ? 'vizinho apoia' : 'vizinhos apoiam'}</Text>
            </View>
          </View>

          {podeApoiar ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eu também vi este problema"
              accessibilityState={{ disabled: ocupado, busy: ocupado }}
              disabled={ocupado}
              onPress={() => agir(() => servico.apoiar(oc.id, usuario))}
              style={({ pressed }) => [e.tambem, (pressed || ocupado) && { opacity: 0.85 }]}
            >
              <View style={e.mais}>
                <Icone nome="mais" cor={t.cores.destaque} tamanho={17} peso="bold" />
              </View>
              <Text style={e.textoTambem}>Eu também vi este problema</Text>
            </Pressable>
          ) : ehAutor || jaApoiou ? (
            <View style={e.nota}>
              <View style={e.visto}>
                <Icone nome="feito" cor={t.cores.sobreDestaque} tamanho={16} peso="bold" />
              </View>
              <Text style={e.textoNota}>{ehAutor ? 'Você registrou esta ocorrência' : 'Você apoiou esta ocorrência'}</Text>
            </View>
          ) : null}
        </View>

        {erro ? <Mensagem texto={erro} tipo="erro" /> : null}

        <Widget titulo="Andamento">
          <View style={e.etapas} accessible accessibilityLabel={`Andamento: ${ROTULO_STATUS[oc.status]}`}>
            <View style={e.segmentos}>
              {STATUS.map((s, i) => (
                <View key={s} style={[e.segmento, i <= atual && e.segmentoFeito]} />
              ))}
            </View>
            <Text style={e.textoEtapa}>
              Etapa {atual + 1} de {STATUS.length}
            </Text>
          </View>
          {eventos.map((h, n) => (
            <View key={`${h.status}-${h.i}`} style={e.evento}>
              <View style={e.eixo}>
                <View style={[e.bolinha, n === 0 && e.bolinhaAtual]} />
                {n < eventos.length - 1 ? <View style={e.fio} /> : null}
              </View>
              <View style={[e.textoEvento, n === eventos.length - 1 && { paddingBottom: 0 }]}>
                <Text style={e.tituloEvento}>
                  {ROTULO_STATUS[h.status]} em {dataCurta(h.em)}
                </Text>
                <Text style={e.autorEvento}>{h.i === 0 ? 'Registro de um morador' : 'Associação de moradores'}</Text>
              </View>
            </View>
          ))}
        </Widget>

        {usuario.moderador ? (
          <Widget titulo="Moderação" estilo={{ gap: 10 }}>
            {proximosStatus(oc.status).map((s: Status) => (
              <Botao
                key={s}
                titulo={`Marcar como ${ROTULO_STATUS[s]}`}
                icone="associacao"
                aoPressionar={() => agir(() => servico.mudarStatus(oc.id, s, usuario))}
                desabilitado={ocupado}
              />
            ))}
            {oc.oculta ? (
              <>
                <Mensagem texto="Oculta para os moradores" estilo={{ backgroundColor: t.cores.fundo, marginVertical: 0 }} />
                <Botao
                  titulo="Mostrar de novo"
                  icone="olho"
                  variante="secundario"
                  aoPressionar={() => agir(() => servico.definirOculta(oc.id, false, usuario))}
                />
              </>
            ) : (
              <Botao
                titulo="Ocultar dos moradores"
                icone="oculto"
                variante="perigo"
                aoPressionar={() => agir(() => servico.definirOculta(oc.id, true, usuario))}
                desabilitado={ocupado}
              />
            )}
          </Widget>
        ) : null}
      </View>
    </ScrollView>
  );
}

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    vazio: { flex: 1, padding: 16, gap: 12, backgroundColor: c.fundo },
    rolagem: { paddingBottom: 48, flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
    heroi: { height: 340, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden', backgroundColor: c.dados },
    semFoto: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    topoHeroi: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
    baseHeroi: { position: 'absolute', left: 20, right: 20, bottom: 20, gap: 4 },
    metaHeroi: { color: 'rgba(255,255,255,0.88)', fontFamily: fontes.regular, fontSize: 12.5 },
    titulo: { color: '#FFFFFF', fontFamily: fontes.titulo, fontSize: 30, lineHeight: 32, letterSpacing: -0.6 },
    corpo: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
    descricao: { fontSize: 16, fontFamily: fontes.regular, color: c.texto, lineHeight: 23 },
    dupla: { flexDirection: 'row', gap: 12 },
    apoios: { flex: 1, minHeight: 112, padding: 16, paddingVertical: 14, borderRadius: 24, backgroundColor: c.apoio, justifyContent: 'space-between', gap: 10 },
    avatares: { flexDirection: 'row' },
    avatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: c.apoio },
    linhaApoios: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
    numeroApoios: { color: c.destaque, fontFamily: fontes.titulo, fontSize: 34, lineHeight: 36 },
    legendaApoios: { color: c.apoioSuave, fontFamily: fontes.regular, fontSize: 13 },
    tambem: { flex: 1, minHeight: 112, padding: 16, paddingVertical: 14, borderRadius: 24, backgroundColor: c.destaque, justifyContent: 'space-between', gap: 10 },
    mais: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.sobreDestaque, alignItems: 'center', justifyContent: 'center' },
    textoTambem: { color: c.sobreDestaque, fontFamily: fontes.titulo, fontSize: 18, lineHeight: 20 },
    nota: { flex: 1, minHeight: 112, padding: 16, paddingVertical: 14, borderRadius: 24, backgroundColor: c.cartao, justifyContent: 'space-between', gap: 10 },
    visto: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.destaque, alignItems: 'center', justifyContent: 'center' },
    textoNota: { color: c.texto, fontFamily: fontes.semi, fontSize: 14.5, lineHeight: 19 },
    etapas: { gap: 6, marginBottom: 14 },
    segmentos: { flexDirection: 'row', gap: 5 },
    segmento: { flex: 1, height: 5, borderRadius: 3, backgroundColor: c.trilho },
    segmentoFeito: { backgroundColor: c.texto },
    textoEtapa: { color: c.suave, fontFamily: fontes.regular, fontSize: 12.5 },
    evento: { flexDirection: 'row', gap: 12 },
    eixo: { alignItems: 'center', width: 14 },
    bolinha: { width: 14, height: 14, borderRadius: 7, marginTop: 3, backgroundColor: c.texto },
    bolinhaAtual: { backgroundColor: c.destaque, boxShadow: '0 0 0 4px rgba(212,242,90,0.28)' },
    fio: { width: 2, flex: 1, backgroundColor: c.linha, marginVertical: 4 },
    textoEvento: { flex: 1, paddingBottom: 14 },
    tituloEvento: { color: c.texto, fontSize: 14.5, fontFamily: fontes.semi },
    autorEvento: { color: c.suave, fontSize: 12.5, fontFamily: fontes.regular, marginTop: 1 },
  });
