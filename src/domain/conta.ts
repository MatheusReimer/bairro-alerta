export const SENHA_MINIMA = 8;

export type DadosCadastro = { email: string; senha: string };
export type ErrosCadastro = Partial<Record<keyof DadosCadastro, string>>;

// Formato simples e suficiente: algo@algo.dominio, sem espaços. A confirmação real é do Firebase Auth.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCadastro({ email, senha }: DadosCadastro): ErrosCadastro {
  const erros: ErrosCadastro = {};
  if (!FORMATO_EMAIL.test(email.trim())) erros.email = 'Informe um e-mail válido.';
  if (senha.length < SENHA_MINIMA) erros.senha = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  return erros;
}

const CREDENCIAIS_INVALIDAS = new Set([
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/invalid-credential',
  'auth/invalid-email',
]);

/**
 * Traduz o código de erro do Firebase Auth para o morador. Senha errada e e-mail inexistente recebem a
 * mesma mensagem para não revelar quais e-mails têm conta (OWASP: enumeração de usuários).
 */
export function mensagemErroLogin(codigo: string): string {
  if (CREDENCIAIS_INVALIDAS.has(codigo)) return 'E-mail ou senha incorretos.';
  if (codigo === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if (codigo === 'auth/email-already-in-use') return 'Este e-mail já tem uma conta. Tente entrar.';
  return 'Não foi possível conectar. Verifique a internet e tente de novo.';
}
