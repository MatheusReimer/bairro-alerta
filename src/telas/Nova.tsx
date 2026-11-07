import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartaoOcorrencia } from '../componentes/CartaoOcorrencia';
import { Icone } from '../componentes/icones';
import { fontes, useEstilos, useTema, type Tema } from '../componentes/tema';
import { Botao, BotaoRedondo, Chip, Mensagem, Widget } from '../componentes/ui';
import { voltar } from '../componentes/voltar';
import { useAmbiente, useOcorrencias, useUsuario, type OrigemFoto } from '../contexto/ambiente';
import { CATEGORIAS, DESCRICAO_MAXIMA, type Categoria, type Local, type Ocorrencia } from '../domain/ocorrencia';
import { ErroRegra } from '../domain/regras';
import { distanciaMetros, sugerirSemelhantes } from '../domain/semelhantes';
import { obterLocalAtual } from '../servicos/localizacao';

const ERRO_ENVIO = 'Não foi possível enviar. Verifique a internet e tente de novo.';

export function Nova() {
  const { servico, localizacao, obterFoto } = useAmbiente();
  const usuario = useUsuario();
  const ocorrencias = useOcorrencias();
  const t = useTema();
  const e = useEstilos(criarEstilos);

  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [local, setLocal] = useState<Local | null>(null);
  const [buscandoLocal, setBuscandoLocal] = useState(true);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [semelhantes, setSemelhantes] = useState<Ocorrencia[] | null>(null);

  const [tentativaLocal, setTentativaLocal] = useState(0);

  useEffect(() => {
    let ativo = true;
    obterLocalAtual(localizacao)
      .then(
        (l) => ativo && setLocal(l),
        (e: Error) => ativo && setErroLocal(e.message),
      )
      .finally(() => ativo && setBuscandoLocal(false));
    return () => {
      ativo = false;
    };
  }, [localizacao, tentativaLocal]);

  function buscarLocal() {
    setBuscandoLocal(true);
    setErroLocal(null);
    setTentativaLocal((t) => t + 1);
  }

  async function escolherFoto(origem: OrigemFoto) {
    setErro(null);
    try {
      const uri = await obterFoto(origem);
      if (uri) setFotoUri(uri);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function registrar() {
    setErro(null);
    setEnviando(true);
    try {
      await servico.registrar({ fotoUri, categoria, local, descricao }, usuario);
      router.replace({ pathname: '/', params: { registrada: '1' } });
    } catch (e) {
      setErro(e instanceof ErroRegra ? e.message : ERRO_ENVIO);
      setEnviando(false);
    }
  }

  function enviar() {
    // Antes de criar, mostra registros do mesmo problema por perto (história #6).
    const parecidas = sugerirSemelhantes({ categoria: categoria!, local: local! }, ocorrencias ?? []);
    if (parecidas.length > 0 && semelhantes === null) {
      setSemelhantes(parecidas);
      return;
    }
    registrar();
  }

  async function apoiarExistente(oc: Ocorrencia) {
    setErro(null);
    try {
      if (oc.autorId !== usuario.uid && !oc.apoiadores.includes(usuario.uid)) await servico.apoiar(oc.id, usuario);
      router.replace(`/ocorrencia/${oc.id}`);
    } catch (e) {
      setErro(e instanceof ErroRegra ? e.message : ERRO_ENVIO);
    }
  }

  const podeEnviar = !!fotoUri && !!categoria && !!local && !enviando;
  const etapas = [!!fotoUri, !!categoria, !!local].filter(Boolean).length;

  if (semelhantes && semelhantes.length > 0) {
    const [maisPerto] = semelhantes;
    const jaMinha = maisPerto.autorId === usuario.uid || maisPerto.apoiadores.includes(usuario.uid);
    return (
      <View style={e.fundoFolha}>
        {fotoUri ? <Image source={{ uri: fotoUri }} style={e.fotoAoFundo} accessibilityElementsHidden importantForAccessibility="no" /> : null}
        <View style={e.veu} />
        <ScrollView contentContainerStyle={e.rolagemFolha}>
          <View style={e.folha}>
            <View style={e.alca} />
            <View style={e.selo}>
              <Icone nome="vizinhos" cor={t.cores.sobreDestaque} tamanho={26} peso="bold" />
            </View>
            <Text accessibilityRole="header" style={e.tituloFolha}>
              Já existe um registro parecido aqui
            </Text>
            <Text style={e.textoFolha}>
              Apoiar o registro que já existe mostra à prefeitura que mais gente é afetada, sem duplicar o problema.
            </Text>
            <View style={e.caixaParecida}>
              <CartaoOcorrencia
                ocorrencia={maisPerto}
                aoPressionar={() => router.push(`/ocorrencia/${maisPerto.id}`)}
                extra={`a ${Math.round(distanciaMetros(local!, maisPerto.local))} m`}
                sobreFundo
              />
            </View>
            {erro ? <Mensagem texto={erro} tipo="erro" /> : null}
            <Botao
              titulo={jaMinha ? 'Ver esta' : 'Apoiar esta'}
              icone={jaMinha ? 'olho' : 'apoio'}
              aoPressionar={() => apoiarExistente(maisPerto)}
              estilo={{ marginTop: 6 }}
            />
            <Botao titulo="Criar nova mesmo assim" variante="fantasma" aoPressionar={registrar} carregando={enviando} estilo={{ marginTop: 4 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  let blocoLocal: ReactNode;
  if (buscandoLocal) {
    blocoLocal = (
      <>
        <ActivityIndicator color={t.cores.texto} />
        <Text style={e.textoLocal}>Buscando sua localização...</Text>
      </>
    );
  } else if (local) {
    blocoLocal = (
      <>
        <View style={e.pinoLocal}>
          <Icone nome="local" cor={t.cores.sobreDestaque} tamanho={15} peso="fill" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={e.textoLocal}>Local marcado pelo GPS</Text>
          <Text style={e.subLocal}>Sua posição atual</Text>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={e.tela} edges={['top', 'bottom']}>
      <View style={e.barraTopo}>
        <BotaoRedondo icone="fechar" rotulo="Fechar" tamanho={44} aoPressionar={voltar} />
        <View style={e.progresso} accessible accessibilityLabel={`${etapas} de 3 itens obrigatórios preenchidos`}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[e.segmento, i < etapas && e.segmentoFeito]} />
          ))}
        </View>
        <Text style={e.textoProgresso} importantForAccessibility="no" accessibilityElementsHidden>
          {etapas} de 3
        </Text>
      </View>

      <ScrollView contentContainerStyle={e.rolagem} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={e.titulo}>
          O que você encontrou?
        </Text>

        {fotoUri ? (
          <View style={e.foto}>
            <Image source={{ uri: fotoUri }} style={StyleSheet.absoluteFill} accessibilityLabel="Foto do problema" resizeMode="cover" />
            <View style={e.privacidade}>
              <Icone nome="feito" cor={t.cores.destaque} tamanho={14} peso="bold" />
              <Text style={e.textoPrivacidade}>Dados de localização da foto removidos no envio</Text>
            </View>
            {blocoLocal ? <View style={e.localSobreFoto}>{blocoLocal}</View> : null}
          </View>
        ) : (
          <View style={[e.foto, e.semFoto]}>
            <View style={e.iconeFoto}>
              <Icone nome="camera" cor={t.cores.texto} tamanho={26} peso="bold" />
            </View>
            <Text style={e.textoSemFoto}>Nenhuma foto ainda</Text>
            <Text style={e.dicaSemFoto}>Uma foto ajuda a associação a entender o problema.</Text>
          </View>
        )}

        <View style={e.linha}>
          <Botao titulo="Tirar foto" icone="camera" variante="secundario" aoPressionar={() => escolherFoto('camera')} estilo={e.botaoFoto} />
          <Botao
            titulo="Escolher da galeria"
            icone="galeria"
            variante="secundario"
            aoPressionar={() => escolherFoto('galeria')}
            estilo={[e.botaoFoto, { flex: 1.4 }]}
          />
        </View>

        {!fotoUri && blocoLocal ? <View style={e.localSolto}>{blocoLocal}</View> : null}
        {!buscandoLocal && !local ? (
          <View style={{ gap: 8 }}>
            <Mensagem texto={erroLocal ?? ''} tipo="erro" estilo={{ marginVertical: 0 }} />
            <Botao titulo="Tentar de novo" variante="secundario" aoPressionar={buscarLocal} />
          </View>
        ) : null}

        <Widget>
          <Text style={e.rotulo}>Escolha o tipo</Text>
          <View style={e.chips}>
            {CATEGORIAS.map((c) => (
              <Chip
                key={c.id}
                texto={c.rotulo}
                selecionado={categoria === c.id}
                aoPressionar={() => {
                  setCategoria(c.id);
                  setSemelhantes(null);
                }}
              />
            ))}
          </View>
        </Widget>

        <Widget>
          <View style={e.linhaRotulo}>
            <Icone nome="descricao" cor={t.cores.suave} tamanho={17} peso="bold" />
            <Text style={e.rotulo}>Descrição (opcional)</Text>
          </View>
          <TextInput
            accessibilityLabel="Descrição (opcional)"
            style={e.campo}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            maxLength={DESCRICAO_MAXIMA}
            placeholder="Ex.: buraco fundo perto do ponto de ônibus"
            placeholderTextColor={t.cores.suave}
          />
        </Widget>

        {erro ? <Mensagem texto={erro} tipo="erro" /> : null}
      </ScrollView>

      <View style={e.rodape}>
        <Botao titulo="Cancelar" variante="secundario" aoPressionar={voltar} estilo={{ flex: 1, borderWidth: 0 }} />
        <Botao
          titulo="Enviar"
          iconeDepois="avancar"
          aoPressionar={enviar}
          desabilitado={!podeEnviar}
          carregando={enviando}
          estilo={{ flex: 1.3 }}
        />
      </View>
    </SafeAreaView>
  );
}

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: c.fundo },
    barraTopo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, width: '100%', maxWidth: 720, alignSelf: 'center' },
    progresso: { flex: 1, flexDirection: 'row', gap: 5 },
    segmento: { flex: 1, height: 5, borderRadius: 3, backgroundColor: c.trilho },
    segmentoFeito: { backgroundColor: c.texto },
    textoProgresso: { color: c.suave, fontFamily: fontes.media, fontSize: 12.5 },
    rolagem: { padding: 16, paddingTop: 14, paddingBottom: 24, gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
    titulo: { color: c.texto, fontFamily: fontes.titulo, fontSize: 28, lineHeight: 30, letterSpacing: -0.7, marginHorizontal: 4 },
    foto: { height: 210, borderRadius: 26, overflow: 'hidden', backgroundColor: c.cartao },
    semFoto: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20 },
    iconeFoto: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo, marginBottom: 4 },
    textoSemFoto: { color: c.texto, fontFamily: fontes.semi, fontSize: 15 },
    dicaSemFoto: { color: c.suave, fontFamily: fontes.regular, fontSize: 13, textAlign: 'center' },
    privacidade: {
      position: 'absolute',
      left: 12,
      top: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingLeft: 8,
      paddingRight: 11,
      borderRadius: 16,
      backgroundColor: 'rgba(22,22,22,0.72)',
    },
    textoPrivacidade: { color: '#F2F2EE', fontFamily: fontes.media, fontSize: 12 },
    localSobreFoto: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: c.vidro,
    },
    localSolto: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 22, backgroundColor: c.cartao },
    pinoLocal: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.destaque },
    textoLocal: { color: c.texto, fontFamily: fontes.semi, fontSize: 14 },
    subLocal: { color: c.suave, fontFamily: fontes.regular, fontSize: 12 },
    linha: { flexDirection: 'row', gap: 10 },
    botaoFoto: { flex: 1, minHeight: 48, paddingHorizontal: 12, borderWidth: 0 },
    rotulo: { color: c.suave, fontFamily: fontes.regular, fontSize: 14 },
    linhaRotulo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    campo: {
      marginTop: 10,
      borderRadius: 16,
      padding: 14,
      minHeight: 96,
      fontSize: 15,
      fontFamily: fontes.regular,
      textAlignVertical: 'top',
      backgroundColor: c.fundo,
      color: c.texto,
    },
    rodape: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, width: '100%', maxWidth: 720, alignSelf: 'center' },
    fundoFolha: { flex: 1, backgroundColor: c.fundo },
    fotoAoFundo: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
    veu: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.veu },
    rolagemFolha: { flexGrow: 1, justifyContent: 'flex-end', paddingTop: 120 },
    folha: {
      backgroundColor: c.cartao,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 16,
      paddingTop: 10,
      paddingBottom: 32,
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
    },
    alca: { width: 40, height: 5, borderRadius: 3, backgroundColor: c.trilho, alignSelf: 'center', marginBottom: 16 },
    selo: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: c.destaque, marginBottom: 14 },
    tituloFolha: { color: c.texto, fontFamily: fontes.titulo, fontSize: 24, letterSpacing: -0.5, lineHeight: 27 },
    textoFolha: { color: c.suave, fontFamily: fontes.regular, fontSize: 14.5, lineHeight: 21, marginTop: 8 },
    caixaParecida: { backgroundColor: c.fundo, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 2, marginTop: 16, marginBottom: 10 },
  });
