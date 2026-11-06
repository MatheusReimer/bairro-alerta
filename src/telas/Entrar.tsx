import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Botao, cores, Mensagem } from '../componentes/ui';
import { useAmbiente } from '../contexto/ambiente';
import { ErroAutenticacao } from '../dados/tipos';
import { mensagemErroLogin } from '../domain/conta';

export function Entrar() {
  const { autenticacao, usuario } = useAmbiente();
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilosConta.tela}>
      <View style={estilosConta.caixa}>
        <Text accessibilityRole="header" style={estilosConta.marca}>
          Bairro Alerta
        </Text>
        <Text style={estilosConta.subtitulo}>Registre e acompanhe os problemas do seu bairro.</Text>

        <Text style={estilosConta.rotulo}>E-mail</Text>
        <TextInput
          accessibilityLabel="E-mail"
          style={estilosConta.campo}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Text style={estilosConta.rotulo}>Senha</Text>
        <TextInput
          accessibilityLabel="Senha"
          style={estilosConta.campo}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
        />
        {erro ? <Mensagem texto={erro} tipo="erro" /> : null}
        <Botao titulo="Entrar" aoPressionar={entrar} desabilitado={!email || !senha} carregando={enviando} estilo={{ marginTop: 16 }} />
        <Link href="/cadastro" style={estilosConta.link}>
          Ainda não tenho conta
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

export const estilosConta = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, justifyContent: 'center', padding: 20 },
  caixa: { backgroundColor: cores.branco, borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  marca: { fontSize: 28, fontWeight: '700', color: cores.azul, textAlign: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: cores.azulEscuro },
  subtitulo: { textAlign: 'center', color: cores.cinza, marginTop: 6, marginBottom: 16 },
  rotulo: { marginTop: 12, marginBottom: 4, color: cores.texto, fontWeight: '600' },
  campo: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: cores.branco,
  },
  erroCampo: { color: cores.vermelho, marginTop: 4 },
  link: { marginTop: 16, color: cores.azul, textAlign: 'center', fontSize: 15, padding: 8 },
  nota: { color: cores.cinza, fontSize: 13, marginTop: 12 },
});
