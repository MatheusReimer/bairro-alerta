import { screen, userEvent, within } from '@testing-library/react-native';

import { ocorrencia } from '../../testing/fixtures';
import { renderizarApp } from '../../testing/renderizarApp';

const buraco = ocorrencia({ id: 'b', categoria: 'buraco', descricao: 'Buraco na Rua Hermann', criadaEm: 3 });
const poste = ocorrencia({ id: 'p', categoria: 'iluminacao', descricao: 'Poste apagado', status: 'encaminhada', criadaEm: 2 });
const entulho = ocorrencia({ id: 'e', categoria: 'entulho', descricao: 'Entulho no terreno', apoios: 4, criadaEm: 1 });

describe('Lista e mapa (história #5)', () => {
  it('T-05-04 lista vazia mostra mensagem em vez de tela em branco', async () => {
    await renderizarApp();

    expect(await screen.findByText('Nenhuma ocorrência por aqui ainda.')).toBeOnTheScreen();
  });

  it('mostra categoria, status e apoios de cada ocorrência', async () => {
    await renderizarApp({ ocorrencias: [buraco, poste, entulho] });

    const cartao = await screen.findByRole('button', { name: /Entulho no terreno/ });
    expect(within(cartao).getByText('Entulho')).toBeOnTheScreen();
    expect(within(cartao).getByText('Aberta')).toBeOnTheScreen();
    expect(within(cartao).getByText('4 apoios')).toBeOnTheScreen();
  });

  it('filtra por categoria', async () => {
    const user = userEvent.setup();
    await renderizarApp({ ocorrencias: [buraco, poste, entulho] });

    await user.press(await screen.findByRole('button', { name: 'Filtrar por Iluminação' }));

    expect(screen.getByText('Poste apagado')).toBeOnTheScreen();
    expect(screen.queryByText('Buraco na Rua Hermann')).not.toBeOnTheScreen();
  });

  it('filtra por status', async () => {
    const user = userEvent.setup();
    await renderizarApp({ ocorrencias: [buraco, poste, entulho] });

    await user.press(await screen.findByRole('button', { name: 'Filtrar por Encaminhada à prefeitura' }));

    expect(screen.getByText('Poste apagado')).toBeOnTheScreen();
    expect(screen.queryByText('Entulho no terreno')).not.toBeOnTheScreen();
  });

  it('T-05-05 mapa com três ocorrências mostra três marcadores', async () => {
    const user = userEvent.setup();
    await renderizarApp({ ocorrencias: [buraco, poste, entulho] });

    await user.press(await screen.findByRole('button', { name: 'Ver no mapa' }));

    expect(await screen.findAllByTestId('marcador')).toHaveLength(3);
  });

  it('abre o detalhe ao tocar na ocorrência', async () => {
    const user = userEvent.setup();
    await renderizarApp({ ocorrencias: [buraco] });

    await user.press(await screen.findByRole('button', { name: /Buraco na Rua Hermann/ }));

    expect(await screen.findByRole('header', { name: 'Buraco' })).toBeOnTheScreen();
  });

  it('T-05-03 morador não vê ocorrência ocultada; moderador vê com aviso', async () => {
    const oculta = ocorrencia({ descricao: 'Propaganda', oculta: true });

    await renderizarApp({ ocorrencias: [oculta, buraco] });
    expect(await screen.findByText('Buraco na Rua Hermann')).toBeOnTheScreen();
    expect(screen.queryByText('Propaganda')).not.toBeOnTheScreen();
  });

  it('moderador vê as ocultas marcadas', async () => {
    await renderizarApp({ logado: 'moderador', ocorrencias: [ocorrencia({ descricao: 'Propaganda', oculta: true })] });

    expect(await screen.findByText('Propaganda')).toBeOnTheScreen();
    expect(screen.getByText('Oculta')).toBeOnTheScreen();
  });
});
