import { distanciaMetros, RAIO_SEMELHANTES_M, sugerirSemelhantes } from '../semelhantes';
import { aoNorte, ocorrencia, PRACA } from '../../testing/fixtures';

describe('distanciaMetros', () => {
  it('é zero para o mesmo ponto', () => {
    expect(distanciaMetros(PRACA, PRACA)).toBe(0);
  });

  it('mede 100 m ao norte com erro menor que 1 m', () => {
    expect(distanciaMetros(PRACA, aoNorte(100))).toBeCloseTo(100, 0);
  });

  it('mede a distância entre Blumenau e Florianópolis (~94 km)', () => {
    const floripa = { latitude: -27.5954, longitude: -48.548 };
    expect(distanciaMetros(PRACA, floripa) / 1000).toBeCloseTo(94.3, 0);
  });
});

describe('sugerirSemelhantes (história #6)', () => {
  const nova = { categoria: 'buraco' as const, local: PRACA };

  it('usa um raio de 50 m', () => {
    expect(RAIO_SEMELHANTES_M).toBe(50);
  });

  it('T-06-01 sugere ocorrência da mesma categoria a 30 m', () => {
    const perto = ocorrencia({ categoria: 'buraco', local: aoNorte(30) });
    expect(sugerirSemelhantes(nova, [perto])).toEqual([perto]);
  });

  it('T-06-02 não sugere ocorrência da mesma categoria a 80 m', () => {
    expect(sugerirSemelhantes(nova, [ocorrencia({ categoria: 'buraco', local: aoNorte(80) })])).toEqual([]);
  });

  it('T-06-03 não sugere categoria diferente a 10 m', () => {
    expect(sugerirSemelhantes(nova, [ocorrencia({ categoria: 'entulho', local: aoNorte(10) })])).toEqual([]);
  });

  it('T-06-04 não sugere ocorrência semelhante já resolvida', () => {
    expect(sugerirSemelhantes(nova, [ocorrencia({ status: 'resolvida', local: aoNorte(10) })])).toEqual([]);
  });

  it('não sugere ocorrência oculta pela moderação', () => {
    expect(sugerirSemelhantes(nova, [ocorrencia({ oculta: true, local: aoNorte(10) })])).toEqual([]);
  });

  it('ordena da mais próxima para a mais distante', () => {
    const a40 = ocorrencia({ local: aoNorte(40) });
    const a5 = ocorrencia({ local: aoNorte(5) });
    expect(sugerirSemelhantes(nova, [a40, a5])).toEqual([a5, a40]);
  });
});
