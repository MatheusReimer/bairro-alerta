import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao, Carregando, cores, corDoStatus, Mensagem, Secao, Selo, dataCurta, textoApoios } from '../componentes/ui';
import { useAmbiente, useOcorrencias, useUsuario } from '../contexto/ambiente';
import { proximosStatus } from '../domain/moderacao';
import { ROTULO_STATUS, rotuloCategoria, type Status } from '../domain/ocorrencia';
import { ErroRegra } from '../domain/regras';

export function Detalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { servico, repositorio } = useAmbiente();
  const usuario = useUsuario();
  const ocorrencias = useOcorrencias();
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
      <View style={estilos.tela}>
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

  return (
    <ScrollView contentContainerStyle={estilos.tela}>
      {fotoUrl ? <Image source={{ uri: fotoUrl }} style={estilos.foto} accessibilityLabel="Foto do problema" /> : null}
      <View style={estilos.topo}>
        <Text accessibilityRole="header" style={estilos.titulo}>
          {rotuloCategoria(oc.categoria)}
        </Text>
        <Selo texto={ROTULO_STATUS[oc.status]} cor={corDoStatus[oc.status]} />
      </View>
      {oc.descricao ? <Text style={estilos.descricao}>{oc.descricao}</Text> : null}

      <View style={estilos.apoio}>
        <Text style={estilos.apoios}>{textoApoios(oc.apoios)}</Text>
        {ehAutor ? (
          <Text style={estilos.nota}>Você registrou esta ocorrência</Text>
        ) : jaApoiou ? (
          <Text style={estilos.nota}>Você apoiou esta ocorrência</Text>
        ) : oc.status !== 'resolvida' ? (
          <Botao
            titulo="👍 Eu também vi este problema"
            rotulo="Eu também vi este problema"
            aoPressionar={() => agir(() => servico.apoiar(oc.id, usuario))}
            carregando={ocupado}
          />
        ) : null}
      </View>

      {erro ? <Mensagem texto={erro} tipo="erro" /> : null}

      <Secao titulo="Andamento">
        {oc.historico.map((h, i) => (
          <View key={`${h.status}-${i}`} style={estilos.evento}>
            <View style={[estilos.ponto, { backgroundColor: corDoStatus[h.status] }]} />
            <Text style={estilos.textoEvento}>
              {ROTULO_STATUS[h.status]} em {dataCurta(h.em)}
            </Text>
          </View>
        ))}
      </Secao>

      {usuario.moderador ? (
        <Secao titulo="Moderação">
          {proximosStatus(oc.status).map((s: Status) => (
            <Botao
              key={s}
              titulo={`Marcar como ${ROTULO_STATUS[s]}`}
              aoPressionar={() => agir(() => servico.mudarStatus(oc.id, s, usuario))}
              desabilitado={ocupado}
              estilo={{ marginBottom: 10 }}
            />
          ))}
          {oc.oculta ? (
            <>
              <Mensagem texto="Oculta para os moradores" />
              <Botao titulo="Mostrar de novo" variante="secundario" aoPressionar={() => agir(() => servico.definirOculta(oc.id, false, usuario))} />
            </>
          ) : (
            <Botao
              titulo="Ocultar dos moradores"
              variante="perigo"
              aoPressionar={() => agir(() => servico.definirOculta(oc.id, true, usuario))}
              desabilitado={ocupado}
            />
          )}
        </Secao>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { padding: 16, paddingBottom: 40, backgroundColor: cores.fundo, flexGrow: 1 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, marginBottom: 12, backgroundColor: cores.azulClaro },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: cores.texto },
  descricao: { fontSize: 16, color: cores.texto, marginTop: 8 },
  apoio: { marginTop: 16, gap: 8 },
  apoios: { fontSize: 15, color: cores.cinza },
  nota: { fontSize: 15, color: cores.verde, fontWeight: '600' },
  evento: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  ponto: { width: 12, height: 12, borderRadius: 6 },
  textoEvento: { color: cores.texto, fontSize: 15 },
});
