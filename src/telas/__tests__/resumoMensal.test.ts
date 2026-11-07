import { ocorrencia } from '../../testing/fixtures';
import { resolvidasPorMes, textoComparacao } from '../resumoMensal';

const resolvidaEm = (em: number) =>
  ocorrencia({
    status: 'resolvida',
    historico: [
      { status: 'aberta', em: em - 1000 },
      { status: 'resolvida', em },
    ],
  });

// 15/11/2026, meio-dia (horário local).
const AGORA = new Date(2026, 10, 15, 12).getTime();

describe('Resolvidas no mês (widget da tela inicial)', () => {
  it('conta as resolvidas em cada um dos últimos cinco meses, do mais antigo ao atual', () => {
    const lista = [
      resolvidaEm(new Date(2026, 10, 2).getTime()),
      resolvidaEm(new Date(2026, 10, 14).getTime()),
      resolvidaEm(new Date(2026, 9, 30).getTime()),
      resolvidaEm(new Date(2026, 6, 1).getTime()),
      resolvidaEm(new Date(2026, 5, 30).getTime()), // fora da janela
      ocorrencia({ status: 'aberta' }),
    ];

    const r = resolvidasPorMes(lista, AGORA);

    expect(r.contagens).toEqual([1, 0, 0, 1, 2]);
    expect(r.atual).toBe(2);
    expect(r.anterior).toBe(1);
    expect(r.mesAnterior).toBe('outubro');
  });

  it('não conta a mesma data de anos diferentes', () => {
    const r = resolvidasPorMes([resolvidaEm(new Date(2025, 10, 10).getTime())], AGORA);

    expect(r.atual).toBe(0);
  });

  it('em janeiro compara com dezembro do ano anterior', () => {
    const r = resolvidasPorMes([resolvidaEm(new Date(2026, 11, 20).getTime())], new Date(2027, 0, 5).getTime());

    expect(r.anterior).toBe(1);
    expect(r.mesAnterior).toBe('dezembro');
  });

  it('descreve a diferença em relação ao mês anterior', () => {
    expect(textoComparacao({ contagens: [], atual: 8, anterior: 5, mesAnterior: 'outubro' })).toBe('+3 em relação a outubro');
    expect(textoComparacao({ contagens: [], atual: 2, anterior: 4, mesAnterior: 'outubro' })).toBe('-2 em relação a outubro');
    expect(textoComparacao({ contagens: [], atual: 3, anterior: 3, mesAnterior: 'outubro' })).toBe('Igual a outubro');
  });
});
