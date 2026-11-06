import { apoiar } from '../apoio';
import { ocorrencia } from '../../testing/fixtures';

describe('apoiar (história #7)', () => {
  const oc = ocorrencia({ autorId: 'uid-autor' });

  it('T-07-01 primeiro apoio de um usuário sobe o contador para 1', () => {
    const depois = apoiar(oc, 'uid-vizinho');

    expect(depois.apoios).toBe(1);
    expect(depois.apoiadores).toEqual(['uid-vizinho']);
  });

  it('T-07-02 segundo apoio do mesmo usuário é rejeitado e o contador não muda', () => {
    const umApoio = apoiar(oc, 'uid-vizinho');

    expect(() => apoiar(umApoio, 'uid-vizinho')).toThrow('Você já apoiou esta ocorrência.');
    expect(umApoio.apoios).toBe(1);
  });

  it('T-07-03 autor não pode apoiar a própria ocorrência', () => {
    expect(() => apoiar(oc, 'uid-autor')).toThrow('Você não pode apoiar a própria ocorrência.');
  });

  it('não aceita apoio em ocorrência resolvida', () => {
    expect(() => apoiar(ocorrencia({ status: 'resolvida' }), 'uid-vizinho')).toThrow('Esta ocorrência já foi resolvida.');
  });

  it('não altera a ocorrência original', () => {
    apoiar(oc, 'uid-vizinho');
    expect(oc.apoios).toBe(0);
    expect(oc.apoiadores).toEqual([]);
  });

  it('soma apoios de vizinhos diferentes', () => {
    expect(apoiar(apoiar(oc, 'a'), 'b')).toMatchObject({ apoios: 2, apoiadores: ['a', 'b'] });
  });
});
