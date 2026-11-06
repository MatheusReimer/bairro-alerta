import { screen, userEvent } from '@testing-library/react-native';

import { renderizarApp } from '../../testing/renderizarApp';

describe('Entrar e criar conta (história #3)', () => {
  it('quem não está logado vai para a tela de entrar', async () => {
    await renderizarApp({ logado: null });

    expect(await screen.findByRole('header', { name: 'Bairro Alerta' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
  });

  it('T-03-03 botão de cadastrar fica desabilitado com campos vazios', async () => {
    await renderizarApp({ logado: null, rota: '/cadastro' });

    expect(await screen.findByRole('button', { name: 'Criar conta' })).toBeDisabled();
  });

  it('mostra o erro de e-mail inválido no cadastro', async () => {
    const user = userEvent.setup();
    await renderizarApp({ logado: null, rota: '/cadastro' });

    await user.type(await screen.findByLabelText('E-mail'), 'maria.gmail.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-forte');
    await user.press(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Informe um e-mail válido.')).toBeOnTheScreen();
  });

  it('cadastra e leva para a lista do bairro', async () => {
    const user = userEvent.setup();
    await renderizarApp({ logado: null, rota: '/cadastro' });

    await user.type(await screen.findByLabelText('E-mail'), 'jose@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-forte');
    await user.press(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Nenhuma ocorrência por aqui ainda.')).toBeOnTheScreen();
  });

  it('T-03-05 senha errada mostra mensagem genérica', async () => {
    const user = userEvent.setup();
    await renderizarApp({ logado: null });

    await user.type(await screen.findByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'errada123');
    await user.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeOnTheScreen();
  });

  it('entra e sai da conta', async () => {
    const user = userEvent.setup();
    await renderizarApp({ logado: null });

    await user.type(await screen.findByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-forte');
    await user.press(screen.getByRole('button', { name: 'Entrar' }));
    await user.press(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
  });
});
