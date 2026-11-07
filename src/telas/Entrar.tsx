import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icone } from '../componentes/icones';
import { MapaEsquematico } from '../componentes/MapaEsquematico';
import { fontes, useEstilos, useTema, type Tema } from '../componentes/tema';
import { Botao, Mensagem } from '../componentes/ui';
import { useAmbiente } from '../contexto/ambiente';
import { ErroAutenticacao } from '../dados/tipos';
import { mensagemErroLogin } from '../domain/conta';

export function Entrar() {
  const { autenticacao, usuario } = useAmbiente();
  const t = useTema();
  const e = useEstilosConta();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Redirect href="/" />;

  async function entrar() {
    setErro(null);
    setEnviando(true);
    try {
      await autenticacao.entrar(email.trim(), senha);
    } catch (e) {
      setErro(mensagemErroLogin(e instanceof ErroAutenticacao ? e.codigo : ''));
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={e.tela} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={e.rolagem} keyboardShouldPersistTaps="handled">
          <View style={e.mapa}>
            <MapaEsquematico exemplo />
            <View style={e.marca}>
              <View style={e.pinoMarca}>
                <Icone nome="local" cor={t.cores.sobreDestaque} tamanho={16} peso="fill" />
              </View>
              <Text style={e.textoMarca}>Vila Nova, Blumenau</Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={e.marcaTitulo}>
            Bairro Alerta
          </Text>
          <Text style={e.subtitulo}>Registre e acompanhe os problemas do seu bairro, junto com os vizinhos.</Text>

          <View style={e.formulario}>
            <Text style={e.rotulo}>E-mail</Text>
            <TextInput
              accessibilityLabel="E-mail"
              style={e.campo}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="voce@email.com"
              placeholderTextColor={t.cores.suave}
            />
            <Text style={e.rotulo}>Senha</Text>
            <TextInput
              accessibilityLabel="Senha"
              style={e.campo}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />
          </View>
          {erro ? <Mensagem texto={erro} tipo="erro" /> : null}
          <Botao titulo="Entrar" iconeDepois="avancar" aoPressionar={entrar} desabilitado={!email || !senha} carregando={enviando} />
          <Link href="/cadastro" style={e.link}>
            Ainda não tenho conta
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Estilos das telas de conta (entrar e cadastro), no tema atual. */
export function useEstilosConta() {
  return useEstilos(criarEstilosConta);
}

const criarEstilosConta = ({ cores: c }: Tema) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: c.fundo },
    rolagem: { flexGrow: 1, justifyContent: 'center', padding: 16, gap: 12, width: '100%', maxWidth: 480, alignSelf: 'center' },
    mapa: { height: 230, borderRadius: 28, overflow: 'hidden' },
    marca: {
      position: 'absolute',
      left: 14,
      top: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: 12,
      borderRadius: 20,
      backgroundColor: c.vidro,
    },
    pinoMarca: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.destaque },
    textoMarca: { color: c.texto, fontFamily: fontes.semi, fontSize: 13 },
    marcaTitulo: { fontSize: 36, lineHeight: 40, fontFamily: fontes.titulo, color: c.texto, letterSpacing: -1, marginTop: 6, marginHorizontal: 4 },
    titulo: { fontSize: 30, lineHeight: 34, fontFamily: fontes.titulo, color: c.texto, letterSpacing: -0.8, marginHorizontal: 4 },
    subtitulo: { color: c.suave, fontFamily: fontes.regular, fontSize: 15, lineHeight: 21, marginTop: -6, marginHorizontal: 4 },
    formulario: { backgroundColor: c.cartao, borderRadius: 26, padding: 16, paddingTop: 10, gap: 6 },
    rotulo: { marginTop: 6, color: c.suave, fontFamily: fontes.media, fontSize: 13 },
    campo: {
      borderRadius: 16,
      paddingHorizontal: 14,
      minHeight: 52,
      fontSize: 16,
      fontFamily: fontes.regular,
      color: c.texto,
      backgroundColor: c.fundo,
    },
    erroCampo: { color: c.erro, fontFamily: fontes.media, fontSize: 13 },
    link: { color: c.destaqueTexto, fontFamily: fontes.semi, textAlign: 'center', fontSize: 15, padding: 8 },
    nota: { color: c.suave, fontFamily: fontes.regular, fontSize: 13, lineHeight: 19 },
  });
