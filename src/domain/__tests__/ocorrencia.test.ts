import { CATEGORIAS, criarOcorrencia, validarNovaOcorrencia, type Rascunho } from '../ocorrencia';

const completo: Rascunho = {
  fotoUri: 'file:///cache/foto.jpg',
  categoria: 'buraco',
  local: { latitude: -26.9194, longitude: -49.0661 },
  descricao: '',
};

describe('validarNovaOcorrencia (história #4)', () => {
  it('T-04-01 rejeita ocorrência sem foto', () => {
    expect(validarNovaOcorrencia({ ...completo, fotoUri: null }).foto).toBe('Tire ou escolha uma foto do problema.');
  });

  it('T-04-02 rejeita ocorrência sem localização', () => {
    expect(validarNovaOcorrencia({ ...completo, local: null }).local).toBe('Não conseguimos o local. Ative o GPS e tente de novo.');
  });

  it('T-04-03 rejeita ocorrência sem categoria', () => {
    expect(validarNovaOcorrencia({ ...completo, categoria: null }).categoria).toBe('Escolha uma categoria.');
  });

  it('T-04-04 aceita ocorrência sem descrição (descrição é opcional)', () => {
    expect(validarNovaOcorrencia(completo)).toEqual({});
  });

  it('T-04-05 rejeita categoria fora da lista', () => {
    const erros = validarNovaOcorrencia({ ...completo, categoria: 'barulho' as never });

    expect(erros.categoria).toBe('Escolha uma categoria.');
  });

  it('lista exatamente as seis categorias do escopo', () => {
    expect(CATEGORIAS.map((c) => c.id)).toEqual(['buraco', 'iluminacao', 'entulho', 'calcada', 'alagamento', 'outros']);
  });

  it('rejeita descrição acima de 500 caracteres', () => {
    expect(validarNovaOcorrencia({ ...completo, descricao: 'a'.repeat(501) }).descricao).toBe(
      'A descrição pode ter no máximo 500 caracteres.',
    );
  });

  it('rejeita coordenadas impossíveis', () => {
    expect(validarNovaOcorrencia({ ...completo, local: { latitude: 120, longitude: 0 } }).local).toBeDefined();
  });
});

describe('criarOcorrencia (história #4)', () => {
  const agora = new Date('2026-11-06T12:00:00Z').getTime();

  it('T-04-07 começa com status "aberta", sem apoios e visível', () => {
    const nova = criarOcorrencia(completo, 'uid-maria', 'fotos/uid-maria/abc.jpg', agora);

    expect(nova).toMatchObject({ status: 'aberta', apoios: 0, apoiadores: [], oculta: false, criadaEm: agora });
    expect(nova.historico).toEqual([{ status: 'aberta', em: agora }]);
  });

  it('remove espaços extras da descrição', () => {
    expect(criarOcorrencia({ ...completo, descricao: '  fundo  ' }, 'u', 'f', agora).descricao).toBe('fundo');
  });

  it('T-SEG-04 não leva nome nem e-mail do autor para o documento público', () => {
    const nova = criarOcorrencia(completo, 'uid-maria', 'fotos/uid-maria/abc.jpg', agora);

    expect(Object.keys(nova).sort()).toEqual(
      ['apoiadores', 'apoios', 'autorId', 'categoria', 'criadaEm', 'descricao', 'fotoPath', 'historico', 'local', 'oculta', 'status'].sort(),
    );
    expect(JSON.stringify(nova)).not.toMatch(/@/);
  });

  it('recusa criar a partir de um rascunho inválido', () => {
    expect(() => criarOcorrencia({ ...completo, fotoUri: null }, 'u', 'f', agora)).toThrow('Ocorrência inválida');
  });
});
