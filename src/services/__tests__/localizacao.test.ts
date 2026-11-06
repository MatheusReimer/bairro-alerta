import { ErroLocalizacao, obterLocalAtual, type ProvedorLocalizacao } from '../localizacao';

function provedor(sobrescrever: Partial<ProvedorLocalizacao> = {}): ProvedorLocalizacao {
  return {
    pedirPermissao: jest.fn().mockResolvedValue(true),
    posicaoAtual: jest.fn().mockResolvedValue({ latitude: -26.9194, longitude: -49.0661 }),
    ...sobrescrever,
  };
}

describe('obterLocalAtual (história #4)', () => {
  it('devolve a posição quando a permissão é concedida', async () => {
    await expect(obterLocalAtual(provedor())).resolves.toEqual({ latitude: -26.9194, longitude: -49.0661 });
  });

  it('T-04-09 GPS negado: erro claro e nenhuma leitura de posição', async () => {
    const p = provedor({ pedirPermissao: jest.fn().mockResolvedValue(false) });

    const promessa = obterLocalAtual(p);

    await expect(promessa).rejects.toBeInstanceOf(ErroLocalizacao);
    await expect(promessa).rejects.toThrow(
      'Precisamos da sua localização para marcar o problema no mapa. Permita o acesso nas configurações do celular.',
    );
    expect(p.posicaoAtual).not.toHaveBeenCalled();
  });

  it('GPS desligado ou sem sinal: erro claro', async () => {
    const p = provedor({ posicaoAtual: jest.fn().mockRejectedValue(new Error('Location services are disabled')) });

    await expect(obterLocalAtual(p)).rejects.toThrow('Não conseguimos o local. Ative o GPS e tente de novo.');
  });
});
