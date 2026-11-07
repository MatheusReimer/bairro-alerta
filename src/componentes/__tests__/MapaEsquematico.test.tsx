import { render, screen } from '@testing-library/react-native';

import { ocorrencia } from '../../testing/fixtures';
import { MapaEsquematico } from '../MapaEsquematico';

describe('MapaEsquematico', () => {
  it('mostra o número de apoios no pino', async () => {
    await render(<MapaEsquematico ocorrencias={[ocorrencia({ id: 'a', apoios: 3 })]} />);

    expect(screen.getByText('3', { includeHiddenElements: true })).toBeTruthy();
  });

  it('não mostra "0" no pino de ocorrência sem apoios', async () => {
    await render(<MapaEsquematico ocorrencias={[ocorrencia({ id: 'a', apoios: 0 })]} />);

    expect(screen.queryByText('0', { includeHiddenElements: true })).toBeNull();
  });
});
