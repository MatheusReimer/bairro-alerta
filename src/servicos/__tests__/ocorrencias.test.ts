import { RepositorioMemoria } from '../../dados/memoria';
import type { Rascunho } from '../../domain/ocorrencia';
import { ocorrencia, PRACA } from '../../testing/fixtures';
import { ServicoOcorrencias } from '../ocorrencias';

// JPEG mínimo com um segmento EXIF contendo coordenadas.
const EXIF = [0xff, 0xe1, 0x00, 0x0e, ...Array.from('Exif\0\0GPS-26', (c) => c.charCodeAt(0))];
const JPEG_COM_GPS = Uint8Array.from([0xff, 0xd8, ...EXIF, 0xff, 0xda, 0x00, 0x02, 0x11, 0xff, 0xd9]);

const rascunho: Rascunho = { fotoUri: 'file:///foto.jpg', categoria: 'buraco', local: PRACA, descricao: 'Fundo' };
const maria = { uid: 'uid-maria', moderador: false };
const moderador = { uid: 'uid-mod', moderador: true };

function montar(iniciais = [ocorrencia({ id: 'oc-1', autorId: 'uid-joao', apoiadores: ['uid-ana'], apoios: 1 })]) {
  const repo = new RepositorioMemoria(iniciais);
  const lerFoto = jest.fn().mockResolvedValue(JPEG_COM_GPS);
  const servico = new ServicoOcorrencias(repo, { lerFoto, agora: () => 9_000 });
  return { repo, lerFoto, servico };
}

describe('ServicoOcorrencias.registrar (história #4)', () => {
  it('T-04-10 grava a ocorrência aberta e a foto, sem os metadados de GPS', async () => {
    const { repo, servico } = montar([]);

    const id = await servico.registrar(rascunho, maria);

    const salva = repo.todas().find((o) => o.id === id)!;
    expect(salva).toMatchObject({ status: 'aberta', autorId: 'uid-maria', categoria: 'buraco', criadaEm: 9_000 });
    const foto = repo.fotos.get(salva.fotoPath)!;
    expect(String.fromCharCode(...foto)).not.toContain('GPS');
  });

  it('não envia foto nenhuma quando o rascunho é inválido', async () => {
    const { repo, lerFoto, servico } = montar([]);

    await expect(servico.registrar({ ...rascunho, categoria: null }, maria)).rejects.toThrow('Escolha uma categoria.');
    expect(lerFoto).not.toHaveBeenCalled();
    expect(repo.fotos.size).toBe(0);
  });
});

describe('ServicoOcorrencias.registrar: tamanho da foto', () => {
  it('recusa foto acima de 700 KB sem enviar nada', async () => {
    const { repo, lerFoto, servico } = montar([]);
    const grande = new Uint8Array(700 * 1024 + 10);
    grande.set([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02]);
    lerFoto.mockResolvedValue(grande);

    await expect(servico.registrar(rascunho, maria)).rejects.toThrow('A foto ficou grande demais. Tente tirar de novo.');
    expect(repo.fotos.size).toBe(0);
    expect(repo.todas()).toHaveLength(0);
  });
});

describe('ServicoOcorrencias.apoiar (história #7)', () => {
  it('grava o apoio', async () => {
    const { repo, servico } = montar();

    await servico.apoiar('oc-1', maria);

    expect(repo.todas()[0]).toMatchObject({ apoios: 2, apoiadores: ['uid-ana', 'uid-maria'] });
  });

  it('não grava apoio repetido', async () => {
    const { repo, servico } = montar();

    await expect(servico.apoiar('oc-1', { uid: 'uid-ana', moderador: false })).rejects.toThrow('Você já apoiou');
    expect(repo.todas()[0].apoios).toBe(1);
  });
});

describe('ServicoOcorrencias.mudarStatus (histórias #8 e #9)', () => {
  it('muda o status e avisa autor e apoiadores', async () => {
    const { repo, servico } = montar();

    await servico.mudarStatus('oc-1', 'encaminhada', moderador);

    expect(repo.todas()[0].status).toBe('encaminhada');
    for (const uid of ['uid-joao', 'uid-ana']) {
      expect(repo.avisosDe(uid)).toEqual([
        expect.objectContaining({ ocorrenciaId: 'oc-1', titulo: 'Buraco: Encaminhada à prefeitura', lido: false, criadoEm: 9_000 }),
      ]);
    }
    expect(repo.avisosDe('uid-mod')).toEqual([]);
  });

  it('morador comum não muda status e ninguém é avisado', async () => {
    const { repo, servico } = montar();

    await expect(servico.mudarStatus('oc-1', 'encaminhada', maria)).rejects.toThrow('Só a moderação');
    expect(repo.todas()[0].status).toBe('aberta');
    expect(repo.avisosDe('uid-joao')).toEqual([]);
  });

  it('oculta e reexibe sem avisar ninguém', async () => {
    const { repo, servico } = montar();

    await servico.definirOculta('oc-1', true, moderador);
    expect(repo.todas()[0].oculta).toBe(true);

    await servico.definirOculta('oc-1', false, moderador);
    expect(repo.todas()[0].oculta).toBe(false);
    expect(repo.avisosDe('uid-joao')).toEqual([]);
  });
});
