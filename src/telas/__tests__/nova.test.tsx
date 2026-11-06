import { screen, userEvent } from '@testing-library/react-native';

import { aoNorte, ocorrencia } from '../../testing/fixtures';
import { renderizarApp, UID_MARIA } from '../../testing/renderizarApp';

describe('Registrar ocorrência (histórias #4 e #6)', () => {
  it('T-04-10 fotografa, escolhe a categoria, envia e vê na lista, sem GPS na foto', async () => {
    const user = userEvent.setup();
    const { repositorio } = await renderizarApp();

    await user.press(await screen.findByRole('button', { name: 'Registrar problema' }));
    await user.press(await screen.findByRole('button', { name: 'Tirar foto' }));
    await user.press(screen.getByRole('button', { name: 'Buraco' }));
    expect(await screen.findByText('Local marcado pelo GPS')).toBeOnTheScreen();
    await user.type(screen.getByLabelText('Descrição (opcional)'), 'Fundo, perto do ponto de ônibus');
    await user.press(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Fundo, perto do ponto de ônibus')).toBeOnTheScreen();
    const [salva] = repositorio.todas();
    expect(salva).toMatchObject({ autorId: UID_MARIA, categoria: 'buraco', status: 'aberta' });
    expect(String.fromCharCode(...repositorio.fotos.get(salva.fotoPath)!)).not.toContain('GPS');
  });

  it('só libera o envio com foto e categoria', async () => {
    const user = userEvent.setup();
    await renderizarApp({ rota: '/nova' });

    const enviar = await screen.findByRole('button', { name: 'Enviar' });
    expect(enviar).toBeDisabled();
    await user.press(screen.getByRole('button', { name: 'Escolher da galeria' }));
    expect(enviar).toBeDisabled();
    await user.press(screen.getByRole('button', { name: 'Iluminação' }));
    expect(enviar).toBeEnabled();
  });

  it('T-04-09 GPS negado mostra erro claro e não deixa enviar', async () => {
    const user = userEvent.setup();
    await renderizarApp({
      rota: '/nova',
      ambiente: { localizacao: { pedirPermissao: jest.fn().mockResolvedValue(false), posicaoAtual: jest.fn() } },
    });

    expect(await screen.findByText(/Precisamos da sua localização/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Tirar foto' }));
    await user.press(screen.getByRole('button', { name: 'Buraco' }));
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeOnTheScreen();
  });

  it('câmera cancelada não quebra a tela', async () => {
    const user = userEvent.setup();
    await renderizarApp({ rota: '/nova', ambiente: { obterFoto: jest.fn().mockResolvedValue(null) } });

    await user.press(await screen.findByRole('button', { name: 'Tirar foto' }));

    expect(screen.getByText('Nenhuma foto ainda')).toBeOnTheScreen();
  });

  it('T-06-05 sugere ocorrência parecida antes do envio e permite apoiar', async () => {
    const user = userEvent.setup();
    const vizinha = ocorrencia({ id: 'viz', autorId: 'uid-joao', categoria: 'buraco', descricao: 'Buraco grande', local: aoNorte(30) });
    const { repositorio } = await renderizarApp({ rota: '/nova', ocorrencias: [vizinha] });

    await user.press(await screen.findByRole('button', { name: 'Tirar foto' }));
    await user.press(screen.getByRole('button', { name: 'Buraco' }));
    await screen.findByText('Local marcado pelo GPS');
    await user.press(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Já existe um registro parecido aqui')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Criar nova mesmo assim' })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Apoiar esta' }));

    expect(await screen.findByText('Você apoiou esta ocorrência')).toBeOnTheScreen();
    expect(repositorio.todas()).toHaveLength(1);
    expect(repositorio.todas()[0].apoiadores).toEqual([UID_MARIA]);
  });

  it('cria nova mesmo havendo parecida, se o morador quiser', async () => {
    const user = userEvent.setup();
    const vizinha = ocorrencia({ categoria: 'buraco', local: aoNorte(30) });
    const { repositorio } = await renderizarApp({ rota: '/nova', ocorrencias: [vizinha] });

    await user.press(await screen.findByRole('button', { name: 'Tirar foto' }));
    await user.press(screen.getByRole('button', { name: 'Buraco' }));
    await screen.findByText('Local marcado pelo GPS');
    await user.press(screen.getByRole('button', { name: 'Enviar' }));
    await user.press(await screen.findByRole('button', { name: 'Criar nova mesmo assim' }));

    expect(await screen.findByText('Ocorrência registrada. Obrigado!')).toBeOnTheScreen();
    expect(repositorio.todas()).toHaveLength(2);
  });

  it('mostra erro de envio sem perder o que foi preenchido', async () => {
    const user = userEvent.setup();
    await renderizarApp({ rota: '/nova', ambiente: { lerFoto: jest.fn().mockRejectedValue(new Error('offline')) } });

    await user.press(await screen.findByRole('button', { name: 'Tirar foto' }));
    await user.press(screen.getByRole('button', { name: 'Buraco' }));
    await screen.findByText('Local marcado pelo GPS');
    await user.press(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Não foi possível enviar. Verifique a internet e tente de novo.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Buraco' })).toBeSelected();
  });
});
