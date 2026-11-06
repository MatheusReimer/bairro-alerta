import { Slot } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { AppLayout } from '../telas/AppLayout';
import { Avisos } from '../telas/Avisos';
import { Cadastro } from '../telas/Cadastro';
import { Detalhe } from '../telas/Detalhe';
import { Entrar } from '../telas/Entrar';
import { Lista } from '../telas/Lista';
import { Nova } from '../telas/Nova';
import { AmbienteProvider, type Ambiente } from '../contexto/ambiente';
import { AutenticacaoMemoria, RepositorioMemoria } from '../dados/memoria';
import type { Ocorrencia } from '../domain/ocorrencia';
import { PRACA } from './fixtures';

// JPEG mínimo com EXIF de GPS, para provar que o app remove os metadados no envio.
export const JPEG_COM_GPS = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe1, 0x00, 0x0e, ...Array.from('Exif\0\0GPS-26', (c) => c.charCodeAt(0)),
  0xff, 0xda, 0x00, 0x02, 0x11, 0xff, 0xd9,
]);

type Opcoes = {
  rota?: string;
  logado?: 'maria' | 'moderador' | null;
  ocorrencias?: Ocorrencia[];
  ambiente?: Partial<Ambiente>;
};

/** Monta o app inteiro (rotas reais, dados em memória) para testar as telas como o morador usa. */
export async function renderizarApp({ rota = '/', logado = 'maria', ocorrencias = [], ambiente = {} }: Opcoes = {}) {
  const autenticacao = new AutenticacaoMemoria([
    { email: 'maria@exemplo.com', senha: 'senha-forte' },
    { email: 'mod@associacao.org', senha: 'senha-forte', moderador: true },
  ]);
  if (logado === 'maria') await autenticacao.entrar('maria@exemplo.com', 'senha-forte');
  if (logado === 'moderador') await autenticacao.entrar('mod@associacao.org', 'senha-forte');

  const repositorio = new RepositorioMemoria(ocorrencias);
  const completo: Ambiente = {
    autenticacao,
    repositorio,
    localizacao: { pedirPermissao: jest.fn().mockResolvedValue(true), posicaoAtual: jest.fn().mockResolvedValue(PRACA) },
    obterFoto: jest.fn().mockResolvedValue('file:///cache/foto.jpg'),
    lerFoto: jest.fn().mockResolvedValue(JPEG_COM_GPS),
    agora: () => 1_800_000_000_000,
    ...ambiente,
  };

  function Raiz() {
    return (
      <AmbienteProvider ambiente={completo}>
        <Slot />
      </AmbienteProvider>
    );
  }

  const tela = await renderRouter(
    {
      _layout: Raiz,
      entrar: Entrar,
      cadastro: Cadastro,
      '(app)/_layout': AppLayout,
      '(app)/index': Lista,
      '(app)/nova': Nova,
      '(app)/ocorrencia/[id]': Detalhe,
      '(app)/avisos': Avisos,
    },
    { initialUrl: rota },
  );
  return { tela, autenticacao, repositorio, ambiente: completo };
}

export const UID_MARIA = 'uid-maria@exemplo.com';
export const UID_MODERADOR = 'uid-mod@associacao.org';
