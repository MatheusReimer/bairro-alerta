import { filtrarOcorrencias } from '../lista';
import { mudarStatus, ocultar, proximosStatus, reexibir } from '../moderacao';
import { ocorrencia } from '../../testing/fixtures';

const moderador = { uid: 'uid-mod', moderador: true };
const morador = { uid: 'uid-morador', moderador: false };
const agora = 5_000;

describe('mudarStatus (história #8)', () => {
  it('T-08-01 moderador muda "aberta" para "encaminhada" e o andamento é registrado', () => {
    const depois = mudarStatus(ocorrencia({ status: 'aberta', historico: [{ status: 'aberta', em: 1 }] }), 'encaminhada', moderador, agora);

    expect(depois.status).toBe('encaminhada');
    expect(depois.historico).toEqual([
      { status: 'aberta', em: 1 },
      { status: 'encaminhada', em: agora },
    ]);
  });

  it('T-08-02 "resolvida" não volta para "aberta" sem moderador', () => {
    expect(() => mudarStatus(ocorrencia({ status: 'resolvida' }), 'aberta', morador, agora)).toThrow(
      'Só a moderação pode mudar o status.',
    );
  });

  it('o moderador pode reabrir uma ocorrência resolvida (o problema voltou)', () => {
    expect(mudarStatus(ocorrencia({ status: 'resolvida' }), 'aberta', moderador, agora).status).toBe('aberta');
  });

  it('T-08-03 rejeita transição fora da sequência permitida', () => {
    expect(() => mudarStatus(ocorrencia({ status: 'aberta' }), 'resolvida', moderador, agora)).toThrow(
      'Não é possível passar de "Aberta" para "Resolvida".',
    );
  });

  it('rejeita "mudar" para o mesmo status', () => {
    expect(() => mudarStatus(ocorrencia({ status: 'aberta' }), 'aberta', moderador, agora)).toThrow();
  });

  it('lista os próximos status possíveis para os botões da moderação', () => {
    expect(proximosStatus('aberta')).toEqual(['encaminhada']);
    expect(proximosStatus('encaminhada')).toEqual(['em_andamento', 'resolvida']);
    expect(proximosStatus('em_andamento')).toEqual(['resolvida']);
    expect(proximosStatus('resolvida')).toEqual(['aberta']);
  });
});

describe('ocultar (história #8)', () => {
  it('T-08-06 moderador oculta registro impróprio e ele some da lista pública', () => {
    const impropria = ocorrencia();
    const outra = ocorrencia();

    const lista = [ocultar(impropria, moderador), outra];

    expect(filtrarOcorrencias(lista, {}, { moderador: false })).toEqual([outra]);
  });

  it('morador comum não pode ocultar', () => {
    expect(() => ocultar(ocorrencia(), morador)).toThrow('Só a moderação pode ocultar registros.');
  });

  it('moderador pode reexibir um registro ocultado por engano', () => {
    expect(reexibir(ocultar(ocorrencia(), moderador), moderador).oculta).toBe(false);
  });

  it('morador comum não pode reexibir', () => {
    expect(() => reexibir(ocorrencia({ oculta: true }), morador)).toThrow('Só a moderação pode ocultar registros.');
  });
});
