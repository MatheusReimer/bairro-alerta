import { screen, userEvent } from '@testing-library/react-native';

import { ocorrencia } from '../../testing/fixtures';
import { renderizarApp, UID_MARIA } from '../../testing/renderizarApp';

const doJoao = () =>
  ocorrencia({
    id: 'oc1',
    autorId: 'uid-joao@exemplo.com',
    categoria: 'iluminacao',
    descricao: 'Poste apagado há uma semana',
    historico: [{ status: 'aberta', em: Date.UTC(2026, 10, 2, 15) }],
  });

describe('Detalhe da ocorrência (histórias #7 e #8)', () => {
  it('mostra o problema e o andamento', async () => {
    await renderizarApp({ rota: '/ocorrencia/oc1', ocorrencias: [doJoao()] });

    expect(await screen.findByRole('header', { name: 'Iluminação' })).toBeOnTheScreen();
    expect(screen.getByText('Poste apagado há uma semana')).toBeOnTheScreen();
    expect(screen.getByText('Aberta em 02/11/2026')).toBeOnTheScreen();
  });

  it('T-04-08 não mostra quem registrou', async () => {
    await renderizarApp({ rota: '/ocorrencia/oc1', ocorrencias: [doJoao()] });

    await screen.findByText('Poste apagado há uma semana');
    expect(screen.queryByText(/joao/)).not.toBeOnTheScreen();
  });

  it('T-07-01 morador apoia e o contador sobe', async () => {
    const user = userEvent.setup();
    const { repositorio } = await renderizarApp({ rota: '/ocorrencia/oc1', ocorrencias: [doJoao()] });

    await user.press(await screen.findByRole('button', { name: 'Eu também vi este problema' }));

    expect(await screen.findByText('1 apoio')).toBeOnTheScreen();
    expect(screen.getByText('Você apoiou esta ocorrência')).toBeOnTheScreen();
    expect(repositorio.todas()[0].apoiadores).toEqual([UID_MARIA]);
  });

  it('T-07-03 autor não vê o botão de apoiar', async () => {
    await renderizarApp({ rota: '/ocorrencia/oc1', ocorrencias: [{ ...doJoao(), autorId: UID_MARIA }] });

    expect(await screen.findByText('Você registrou esta ocorrência')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Eu também vi este problema' })).not.toBeOnTheScreen();
  });

  it('morador comum não vê as ações de moderação', async () => {
    await renderizarApp({ rota: '/ocorrencia/oc1', ocorrencias: [doJoao()] });

    await screen.findByText('Poste apagado há uma semana');
    expect(screen.queryByText('Moderação')).not.toBeOnTheScreen();
  });

  it('T-08-01 moderador encaminha e o autor recebe aviso', async () => {
    const user = userEvent.setup();
    const { repositorio } = await renderizarApp({ logado: 'moderador', rota: '/ocorrencia/oc1', ocorrencias: [doJoao()] });

    await user.press(await screen.findByRole('button', { name: 'Marcar como Encaminhada à prefeitura' }));

    expect(await screen.findByRole('button', { name: 'Marcar como Em andamento' })).toBeOnTheScreen();
    expect(repositorio.todas()[0].status).toBe('encaminhada');
    expect(repositorio.avisosDe('uid-joao@exemplo.com')).toHaveLength(1);
  });

  it('T-08-06 moderador oculta e reexibe', async () => {
    const user = userEvent.setup();
    const { repositorio } = await renderizarApp({ logado: 'moderador', rota: '/ocorrencia/oc1', ocorrencias: [doJoao()] });

    await user.press(await screen.findByRole('button', { name: 'Ocultar dos moradores' }));
    expect(await screen.findByText('Oculta para os moradores')).toBeOnTheScreen();
    expect(repositorio.todas()[0].oculta).toBe(true);

    await user.press(screen.getByRole('button', { name: 'Mostrar de novo' }));
    expect(await screen.findByRole('button', { name: 'Ocultar dos moradores' })).toBeOnTheScreen();
  });

  it('ocorrência inexistente ou oculta mostra aviso', async () => {
    await renderizarApp({ rota: '/ocorrencia/nao-existe' });

    expect(await screen.findByText('Ocorrência não encontrada.')).toBeOnTheScreen();
  });
});

describe('Avisos (história #9)', () => {
  it('mostra o aviso de mudança de status e abre a ocorrência', async () => {
    const user = userEvent.setup();
    const oc = { ...doJoao(), autorId: UID_MARIA };
    const { repositorio } = await renderizarApp({ ocorrencias: [oc] });
    await repositorio.alterar('oc1', (atual) => ({
      ocorrencia: { ...atual, status: 'encaminhada' },
      avisos: [{ para: UID_MARIA, ocorrenciaId: 'oc1', titulo: 'Iluminação: Encaminhada à prefeitura', corpo: 'mudou', criadoEm: 1 }],
    }));

    await user.press(await screen.findByRole('button', { name: 'Avisos, 1 não lido' }));
    await user.press(await screen.findByRole('button', { name: /Iluminação: Encaminhada à prefeitura/ }));

    expect(await screen.findByText('Poste apagado há uma semana')).toBeOnTheScreen();
    expect(repositorio.avisosDe(UID_MARIA)[0].lido).toBe(true);
  });

  it('sem avisos mostra mensagem', async () => {
    await renderizarApp({ rota: '/avisos' });

    expect(await screen.findByText('Nenhum aviso por enquanto.')).toBeOnTheScreen();
  });
});
