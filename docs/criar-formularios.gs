/**
 * Cria os dois formulários do projeto no Google Forms da conta logada.
 * Como usar: script.google.com > Novo projeto > cole este arquivo > escolha a função > Executar.
 * Na primeira vez o Google pede autorização para criar formulários na sua conta.
 * Os links aparecem em "Registro de execução".
 */

var GRUPO = 'Grupo 94: Ana Clara, Laura Welter Góes, Matheus Henrique Reimer e Brayan Silveira.';

function criarQuestionarioMoradores() {
  var form = FormApp.create('Problemas de infraestrutura no bairro: sua opinião');
  form
    .setDescription(
      'Olá! Somos estudantes de Análise e Desenvolvimento de Sistemas da UNIVALI e estamos criando o Bairro Alerta, ' +
        'um aplicativo para os moradores registrarem e acompanharem problemas do bairro, como buracos, postes apagados, ' +
        'entulho, calçadas quebradas e alagamentos. A associação de moradores organiza os registros e encaminha à prefeitura.\n\n' +
        'Este questionário leva cerca de 2 minutos e é anônimo: não pedimos nome, e-mail nem endereço. As respostas serão ' +
        'usadas apenas neste trabalho acadêmico, de forma agrupada, conforme a LGPD (Lei nº 13.709/2018). Ao responder, ' +
        'você concorda com esse uso. Obrigado por ajudar o bairro!\n\n' + GRUPO,
    )
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setProgressBar(true)
    .setConfirmationMessage(
      'Obrigado! Quer testar o aplicativo durante uma semana? Fale com a gente pelo grupo do bairro.',
    );

  form
    .addCheckboxItem()
    .setTitle('1. Você notou algum destes problemas no bairro nos últimos seis meses?')
    .setChoiceValues([
      'Buracos na rua',
      'Iluminação pública apagada ou com defeito',
      'Entulho ou lixo descartado em local errado',
      'Calçadas quebradas ou obstruídas',
      'Bocas de lobo entupidas ou alagamentos',
      'Não notei nenhum problema',
    ])
    .showOtherOption(true)
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('2. O que você fez na última vez em que viu um problema desses?')
    .setChoiceValues([
      'Nada',
      'Comentei no grupo de mensagens do bairro',
      'Entrei em contato com a prefeitura (156, site ou aplicativo)',
      'Procurei a associação de moradores',
    ])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('3. Se você fez uma solicitação formal (prefeitura ou associação), recebeu retorno?')
    .setChoiceValues(['Sim', 'Não', 'Não fiz solicitação formal'])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('4. Você costuma saber se outra pessoa já relatou o mesmo problema?')
    .setChoiceValues(['Sim', 'Não'])
    .setRequired(true);

  form
    .addScaleItem()
    .setTitle('5. De 1 a 5, quanto você usaria um aplicativo para registrar e acompanhar esses problemas?')
    .setBounds(1, 5)
    .setLabels('Não usaria', 'Usaria com certeza')
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle('6. Algo deixaria você inseguro ao usar um aplicativo assim?')
    .setChoiceValues([
      'Meu nome aparecer para os vizinhos',
      'Mostrar onde eu moro ou onde eu estava',
      'O que seria feito com meus dados pessoais',
      'Receio de desentendimento com vizinhos',
      'Nada me deixaria inseguro',
    ])
    .showOtherOption(true)
    .setRequired(false);

  form
    .addMultipleChoiceItem()
    .setTitle('7. Qual é o sistema do seu celular?')
    .setChoiceValues(['Android', 'iPhone (iOS)', 'Outro / não sei'])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('8. Qual é a sua faixa etária?')
    .setChoiceValues(['18 a 29 anos', '30 a 49 anos', '50 a 64 anos', '65 anos ou mais'])
    .setRequired(true);

  registrarLinks(form);
}

function criarQuestionarioSUS() {
  var form = FormApp.create('Bairro Alerta: como foi usar o aplicativo?');
  form
    .setDescription(
      'Obrigado por participar do piloto! São 10 afirmações rápidas sobre o aplicativo (escala System Usability Scale). ' +
        'É anônimo e leva cerca de 2 minutos. Marque de 1 (discordo totalmente) a 5 (concordo totalmente).\n\n' + GRUPO,
    )
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false);

  var afirmacoes = [
    'Eu acho que gostaria de usar este aplicativo com frequência.',
    'Eu achei o aplicativo desnecessariamente complexo.',
    'Eu achei o aplicativo fácil de usar.',
    'Eu acho que precisaria de ajuda de uma pessoa com conhecimentos técnicos para usar o aplicativo.',
    'Eu achei que as funções do aplicativo estão bem integradas.',
    'Eu achei que o aplicativo tem muitas inconsistências.',
    'Eu imagino que a maioria das pessoas aprenderia a usar este aplicativo rapidamente.',
    'Eu achei o aplicativo muito complicado de usar.',
    'Eu me senti muito confiante usando o aplicativo.',
    'Eu precisei aprender várias coisas antes de conseguir usar o aplicativo.',
  ];
  afirmacoes.forEach(function (texto, i) {
    form
      .addScaleItem()
      .setTitle(i + 1 + '. ' + texto)
      .setBounds(1, 5)
      .setLabels('Discordo totalmente', 'Concordo totalmente')
      .setRequired(true);
  });

  form.addParagraphTextItem().setTitle('O que você mudaria no aplicativo? (opcional)').setRequired(false);

  registrarLinks(form);
}

function registrarLinks(form) {
  Logger.log('Link para os moradores responderem: ' + form.shortenFormUrl(form.getPublishedUrl()));
  Logger.log('Link para editar: ' + form.getEditUrl());
}
