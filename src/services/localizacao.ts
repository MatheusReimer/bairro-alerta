import type { Local } from '../domain/ocorrencia';

/** Interface para o GPS. Em produção usa o expo-location; nos testes, um objeto simulado. */
export type ProvedorLocalizacao = {
  pedirPermissao(): Promise<boolean>;
  posicaoAtual(): Promise<Local>;
};

export class ErroLocalizacao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroLocalizacao';
  }
}

export async function obterLocalAtual(provedor: ProvedorLocalizacao): Promise<Local> {
  if (!(await provedor.pedirPermissao())) {
    throw new ErroLocalizacao(
      'Precisamos da sua localização para marcar o problema no mapa. Permita o acesso nas configurações do celular.',
    );
  }
  try {
    return await provedor.posicaoAtual();
  } catch {
    throw new ErroLocalizacao('Não conseguimos o local. Ative o GPS e tente de novo.');
  }
}
