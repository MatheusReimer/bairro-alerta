import { mensagemErroLogin, validarCadastro } from '../conta';

describe('validarCadastro (história #3)', () => {
  it('T-03-01 rejeita e-mail em formato inválido', () => {
    const erros = validarCadastro({ email: 'maria.gmail.com', senha: 'segura123' });

    expect(erros.email).toBe('Informe um e-mail válido.');
  });

  it('T-03-02 rejeita senha abaixo do mínimo de 8 caracteres', () => {
    const erros = validarCadastro({ email: 'maria@gmail.com', senha: '1234567' });

    expect(erros.senha).toBe('A senha precisa ter pelo menos 8 caracteres.');
  });

  it('aceita e-mail e senha válidos, ignorando espaços nas pontas do e-mail', () => {
    expect(validarCadastro({ email: '  maria@gmail.com ', senha: '12345678' })).toEqual({});
  });

  it('exige os dois campos', () => {
    expect(validarCadastro({ email: '', senha: '' })).toEqual({
      email: 'Informe um e-mail válido.',
      senha: 'A senha precisa ter pelo menos 8 caracteres.',
    });
  });
});

describe('mensagemErroLogin (história #3)', () => {
  it.each(['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email'])(
    'T-03-05 usa mensagem genérica para %s, sem revelar se o e-mail existe',
    (codigo) => {
      expect(mensagemErroLogin(codigo)).toBe('E-mail ou senha incorretos.');
    },
  );

  it('avisa sobre excesso de tentativas', () => {
    expect(mensagemErroLogin('auth/too-many-requests')).toBe(
      'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    );
  });

  it('avisa quando o e-mail já tem conta no cadastro', () => {
    expect(mensagemErroLogin('auth/email-already-in-use')).toBe('Este e-mail já tem uma conta. Tente entrar.');
  });

  it('cai numa mensagem de conexão para erros desconhecidos', () => {
    expect(mensagemErroLogin('auth/network-request-failed')).toBe(
      'Não foi possível conectar. Verifique a internet e tente de novo.',
    );
  });
});
