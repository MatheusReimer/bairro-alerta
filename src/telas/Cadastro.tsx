import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { Botao, Mensagem } from '../componentes/ui';
import { useAmbiente } from '../contexto/ambiente';
import { ErroAutenticacao } from '../dados/tipos';
import { mensagemErroLogin, SENHA_MINIMA, validarCadastro, type ErrosCadastro } from '../domain/conta';
import { estilosConta as e } from './Entrar';

export function Cadastro() {
  const { autenticacao, usuario } = useAmbiente();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Redirect href="/" />;

  async function cadastrar() {
    setErroGeral(null);
    const encontrados = validarCadastro({ email, senha });
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    try {
      await autenticacao.cadastrar(email.trim(), senha);
    } catch (erro) {
      setErroGeral(mensagemErroLogin(erro instanceof ErroAutenticacao ? erro.codigo : ''));
      setEnviando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[e.tela, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
      <View style={e.caixa}>
        <Text accessibilityRole="header" style={e.titulo}>
          Criar conta
        </Text>
        <Text style={e.rotulo}>E-mail</Text>
        <TextInput
          accessibilityLabel="E-mail"
          style={e.campo}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        {erros.email ? <Text style={e.erroCampo}>{erros.email}</Text> : null}
        <Text style={e.rotulo}>Senha</Text>
        <TextInput
          accessibilityLabel="Senha"
          style={e.campo}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoComplete="new-password"
        />
        {erros.senha ? (
          <Text style={e.erroCampo}>{erros.senha}</Text>
        ) : (
          <Text style={e.nota}>Mínimo de {SENHA_MINIMA} caracteres.</Text>
        )}
        {erroGeral ? <Mensagem texto={erroGeral} tipo="erro" /> : null}
        <Text style={e.nota}>
          Seu e-mail serve só para entrar no app e não aparece para os vizinhos. As ocorrências são públicas para os
          moradores, sem o seu nome (LGPD).
        </Text>
        <Botao titulo="Criar conta" aoPressionar={cadastrar} desabilitado={!email || !senha} carregando={enviando} estilo={{ marginTop: 16 }} />
        <Link href="/entrar" style={e.link}>
          Já tenho conta
        </Link>
      </View>
    </ScrollView>
  );
}
