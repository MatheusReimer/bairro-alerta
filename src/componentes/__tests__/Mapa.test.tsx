import { render, screen, userEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { aoNorte, ocorrencia, PRACA } from '../../testing/fixtures';
import { ATRIBUICAO, Mapa, vistaInicial } from '../Mapa';

const buraco = ocorrencia({ id: 'b', categoria: 'buraco', apoios: 3 });
const poste = ocorrencia({ id: 'p', categoria: 'iluminacao', status: 'encaminhada', apoios: 0, local: aoNorte(200) });

describe('Mapa nativo (MapLibre)', () => {
  it('mostra um marcador por ocorrência, com o número de apoios ou o ícone da categoria', async () => {
    await render(<Mapa ocorrencias={[buraco, poste]} aoAbrir={jest.fn()} />);

    expect(screen.getAllByTestId('marcador')).toHaveLength(2);
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.queryByText('0')).not.toBeOnTheScreen();
  });

  it('descreve cada marcador para leitores de tela', async () => {
    await render(<Mapa ocorrencias={[buraco, poste]} aoAbrir={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Buraco, Aberta, 3 apoios' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Iluminação, .*Nenhum apoio ainda$/ })).toBeOnTheScreen();
  });

  it('tocar no marcador mostra o resumo e tocar no resumo abre a ocorrência', async () => {
    const user = userEvent.setup();
    const aoAbrir = jest.fn();
    await render(<Mapa ocorrencias={[buraco, poste]} aoAbrir={aoAbrir} />);

    expect(screen.queryByText('Toque para abrir')).not.toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Buraco, Aberta, 3 apoios' }));
    expect(screen.getByText('Toque para abrir')).toBeOnTheScreen();
    expect(aoAbrir).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: 'Abrir Buraco, Aberta' }));
    expect(aoAbrir).toHaveBeenCalledWith('b');
  });

  it('fecha o resumo sem abrir a ocorrência', async () => {
    const user = userEvent.setup();
    const aoAbrir = jest.fn();
    await render(<Mapa ocorrencias={[buraco]} aoAbrir={aoAbrir} />);

    await user.press(screen.getByRole('button', { name: 'Buraco, Aberta, 3 apoios' }));
    await user.press(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByText('Toque para abrir')).not.toBeOnTheScreen();
    expect(aoAbrir).not.toHaveBeenCalled();
  });

  it('mostra a atribuição do OpenStreetMap com link para os direitos autorais', async () => {
    const user = userEvent.setup();
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<Mapa ocorrencias={[]} aoAbrir={jest.fn()} />);

    expect(screen.getByText(ATRIBUICAO)).toBeOnTheScreen();
    await user.press(screen.getByRole('link', { name: /OpenStreetMap/ }));
    expect(abrir).toHaveBeenCalledWith('https://www.openstreetmap.org/copyright');
  });
});

describe('vistaInicial', () => {
  it('sem ocorrências, centraliza no bairro', () => {
    expect(vistaInicial([])).toEqual({ center: [PRACA.longitude, PRACA.latitude], zoom: 15 });
  });

  it('com um único ponto, centraliza nele', () => {
    expect(vistaInicial([buraco])).toEqual({ center: [PRACA.longitude, PRACA.latitude], zoom: 16 });
  });

  it('com vários pontos, enquadra todos', () => {
    const vista = vistaInicial([buraco, poste]);
    expect(vista).toMatchObject({ bounds: [PRACA.longitude, PRACA.latitude, PRACA.longitude, aoNorte(200).latitude] });
  });
});
