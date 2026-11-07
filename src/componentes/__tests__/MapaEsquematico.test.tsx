import { render, screen } from '@testing-library/react-native';

import { ocorrencia } from '../../testing/fixtures';
import { EXEMPLO_ALTO, MapaEsquematico, ZONA_TITULO_ALTO } from '../MapaEsquematico';

describe('MapaEsquematico', () => {
  it('mostra o número de apoios no pino', async () => {
    await render(<MapaEsquematico ocorrencias={[ocorrencia({ id: 'a', apoios: 3 })]} />);

    expect(screen.getByText('3', { includeHiddenElements: true })).toBeTruthy();
  });

  it('não mostra "0" no pino de ocorrência sem apoios', async () => {
    await render(<MapaEsquematico ocorrencias={[ocorrencia({ id: 'a', apoios: 0 })]} />);

    expect(screen.queryByText('0', { includeHiddenElements: true })).toBeNull();
  });

  it('na tela de entrar, os pinos de exemplo ficam fora da faixa do título, que esmaece o mapa', () => {
    expect(EXEMPLO_ALTO.length).toBeGreaterThanOrEqual(4);
    for (const p of EXEMPLO_ALTO) expect(p.y).toBeLessThan(ZONA_TITULO_ALTO);
  });
});
