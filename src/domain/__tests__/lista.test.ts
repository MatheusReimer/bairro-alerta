import { filtrarOcorrencias } from '../lista';
import { ocorrencia } from '../../testing/fixtures';

const buraco = ocorrencia({ categoria: 'buraco', status: 'aberta', criadaEm: 10 });
const poste = ocorrencia({ categoria: 'iluminacao', status: 'encaminhada', criadaEm: 30 });
const entulho = ocorrencia({ categoria: 'entulho', status: 'aberta', criadaEm: 20 });
const oculta = ocorrencia({ categoria: 'buraco', status: 'aberta', oculta: true, criadaEm: 40 });
const todas = [buraco, poste, entulho, oculta];

describe('filtrarOcorrencias (história #5)', () => {
  it('T-05-01 filtra por categoria', () => {
    expect(filtrarOcorrencias(todas, { categoria: 'iluminacao' }, { moderador: false })).toEqual([poste]);
  });

  it('T-05-02 filtra por status', () => {
    expect(filtrarOcorrencias(todas, { status: 'aberta' }, { moderador: false })).toEqual([entulho, buraco]);
  });

  it('T-05-03 esconde dos moradores as ocorrências ocultadas pelo moderador', () => {
    expect(filtrarOcorrencias(todas, {}, { moderador: false })).not.toContainEqual(oculta);
  });

  it('o moderador continua vendo as ocultas, para poder revisá-las', () => {
    expect(filtrarOcorrencias(todas, {}, { moderador: true })).toContainEqual(oculta);
  });

  it('ordena da mais recente para a mais antiga', () => {
    expect(filtrarOcorrencias(todas, {}, { moderador: false }).map((o) => o.criadaEm)).toEqual([30, 20, 10]);
  });

  it('combina categoria e status', () => {
    expect(filtrarOcorrencias(todas, { categoria: 'buraco', status: 'encaminhada' }, { moderador: false })).toEqual([]);
  });

  it('não altera a lista original', () => {
    const copia = [...todas];
    filtrarOcorrencias(todas, {}, { moderador: false });
    expect(todas).toEqual(copia);
  });
});
