import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CartaoOcorrencia } from '../componentes/CartaoOcorrencia';
import { Botao, Chip, cores, Mensagem, Secao } from '../componentes/ui';
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

  if (semelhantes && semelhantes.length > 0) {
    const [maisPerto] = semelhantes;
    const jaMinha = maisPerto.autorId === usuario.uid || maisPerto.apoiadores.includes(usuario.uid);
    return (
      <ScrollView contentContainerStyle={estilos.tela}>
        <Text accessibilityRole="header" style={estilos.titulo}>
          Já existe um registro parecido aqui
        </Text>
        <Text style={estilos.texto}>
          Apoiar o registro que já existe mostra à prefeitura que mais gente é afetada, sem duplicar o problema.
        </Text>
        <CartaoOcorrencia
          ocorrencia={maisPerto}
          aoPressionar={() => router.push(`/ocorrencia/${maisPerto.id}`)}
          extra={`a ${Math.round(distanciaMetros(local!, maisPerto.local))} m`}
        />
        {erro ? <Mensagem texto={erro} tipo="erro" /> : null}
        <Botao titulo={jaMinha ? 'Ver esta' : 'Apoiar esta'} aoPressionar={() => apoiarExistente(maisPerto)} />
        <Botao
          titulo="Criar nova mesmo assim"
          variante="secundario"
          aoPressionar={registrar}
          carregando={enviando}
          estilo={{ marginTop: 12 }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={estilos.tela} keyboardShouldPersistTaps="handled">
      <Secao titulo="Foto">
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={estilos.foto} accessibilityLabel="Foto do problema" />
        ) : (
          <View style={[estilos.foto, estilos.semFoto]}>
            <Text style={{ color: cores.cinza }}>Nenhuma foto ainda</Text>
          </View>
        )}
        <View style={estilos.linha}>
          <Botao titulo="Tirar foto" aoPressionar={() => escolherFoto('camera')} estilo={{ flex: 1 }} />
          <Botao titulo="Escolher da galeria" variante="secundario" aoPressionar={() => escolherFoto('galeria')} estilo={{ flex: 1 }} />
        </View>
      </Secao>

      <Secao titulo="Categoria">
        <View style={estilos.chips}>
          {CATEGORIAS.map((c) => (
            <Chip
              key={c.id}
              texto={`${c.icone} ${c.rotulo}`}
              rotulo={c.rotulo}
              selecionado={categoria === c.id}
              aoPressionar={() => {
                setCategoria(c.id);
                setSemelhantes(null);
              }}
            />
          ))}
        </View>
      </Secao>

      <Secao titulo="Local">
        {buscandoLocal ? (
          <View style={estilos.linha}>
            <ActivityIndicator color={cores.azul} />
            <Text style={estilos.texto}>Buscando sua localização...</Text>
          </View>
        ) : local ? (
          <View style={estilos.linha}>
            <Text accessibilityElementsHidden importantForAccessibility="no">📍</Text>
            <Text style={estilos.texto}>Local marcado pelo GPS</Text>
          </View>
        ) : (
          <>
            <Mensagem texto={erroLocal ?? ''} tipo="erro" />
            <Botao titulo="Tentar de novo" variante="secundario" aoPressionar={buscarLocal} />
          </>
        )}
      </Secao>

      <Secao titulo="Descrição (opcional)">
        <TextInput
          accessibilityLabel="Descrição (opcional)"
          style={estilos.campo}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          maxLength={DESCRICAO_MAXIMA}
          placeholder="Ex.: buraco fundo perto do ponto de ônibus"
        />
      </Secao>

      {erro ? <Mensagem texto={erro} tipo="erro" /> : null}
      <Botao titulo="Enviar" aoPressionar={enviar} desabilitado={!podeEnviar} carregando={enviando} estilo={{ marginTop: 20 }} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { padding: 16, paddingBottom: 40, backgroundColor: cores.fundo, flexGrow: 1 },
  titulo: { fontSize: 20, fontWeight: '700', color: cores.azulEscuro, marginBottom: 8 },
  texto: { color: cores.texto, fontSize: 15, marginBottom: 12 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, marginBottom: 12, backgroundColor: cores.azulClaro },
  semFoto: { alignItems: 'center', justifyContent: 'center' },
  linha: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  campo: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 12,
    minHeight: 96,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: cores.branco,
    color: cores.texto,
  },
});
