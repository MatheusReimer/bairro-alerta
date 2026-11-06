import { destinatarios, textoNotificacao } from '../notificacao';
import { ocorrencia } from '../../testing/fixtures';

describe('destinatarios (história #9)', () => {
  const antes = ocorrencia({ autorId: 'uid-autor', apoiadores: ['uid-a', 'uid-b'], apoios: 2, status: 'aberta' });

  it('T-09-01 quando o status muda, autor e apoiadores são avisados', () => {
    expect(destinatarios(antes, { ...antes, status: 'encaminhada' }, 'uid-mod')).toEqual(['uid-autor', 'uid-a', 'uid-b']);
  });

  it('T-09-02 sem troca de status, ninguém é avisado', () => {
    expect(destinatarios(antes, { ...antes, oculta: true }, 'uid-mod')).toEqual([]);
  });

  it('T-09-03 o moderador que fez a mudança não recebe a própria notificação', () => {
    expect(destinatarios(antes, { ...antes, status: 'encaminhada' }, 'uid-a')).toEqual(['uid-autor', 'uid-b']);
  });
});

describe('textoNotificacao (história #9)', () => {
  it('diz o problema e o novo status em linguagem simples', () => {
    const oc = ocorrencia({ categoria: 'iluminacao', status: 'encaminhada' });

    expect(textoNotificacao(oc)).toEqual({
      titulo: 'Iluminação: Encaminhada à prefeitura',
      corpo: 'A ocorrência que você acompanha mudou de status.',
    });
  });

  it('comemora quando o problema é resolvido', () => {
    expect(textoNotificacao(ocorrencia({ categoria: 'buraco', status: 'resolvida' })).corpo).toBe(
      'Problema resolvido! Obrigado por ajudar o bairro.',
    );
  });
});
