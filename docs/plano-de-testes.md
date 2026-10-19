# Plano de Testes: Bairro Alerta

Versão 1.0, Sprint 1 (outubro de 2026). Acadêmico: Matheus Reimer.

## 1. Objetivo

Este plano define o que será testado no Bairro Alerta, como e quando. O projeto segue o desenvolvimento
orientado a testes (BECK, 2003): nenhuma regra de negócio entra no código sem um teste que falhe antes.
Cada caso de teste abaixo nasce de um critério de aceitação do backlog no Trello.

## 2. Escopo

Entra neste plano tudo o que está no escopo do MVP (Seção 4.1.3 do relatório): conta e login, registro de
ocorrência, lista e mapa, sugestão de duplicidade, apoios, moderação, notificações, regras de acesso ao banco
e privacidade das fotos.

Fica de fora: testes em iOS, testes de carga e testes nas lojas de aplicativos, que também estão fora do
escopo do projeto.

## 3. Níveis de teste

| Nível | O que cobre | Ferramenta | Onde roda |
|---|---|---|---|
| Unitário | Regras de domínio (validação, status, apoios, distância) e serviços com dependências simuladas | Jest (`jest-expo`), com `jest.mock` para câmera, GPS e Firebase | Local e GitHub Actions |
| Componente | Telas isoladas: campos obrigatórios, mensagens de erro, botões habilitados ou não | Jest e React Native Testing Library | Local e GitHub Actions |
| Integração | Fluxo completo no app com o Firebase Emulator Suite (Auth, Firestore, Storage) | Maestro (testes ponta a ponta) | Emulador Android |
| Regras de acesso | Regras do Firestore e do Storage: quem lê, quem escreve, quem modera | `@firebase/rules-unit-testing` no emulador | Local e GitHub Actions |
| Manual | Uso em smartphone Android real e piloto com moradores | Roteiro da Seção 7 | Dispositivo real |

A maior parte dos testes fica nos níveis unitário e de componente, que são rápidos e rodam a cada alteração.
Os testes de integração são poucos e cobrem os caminhos principais.

## 4. Ciclo de trabalho

1. Escolher um critério de aceitação do cartão no Trello e mover o cartão para "Teste escrito (vermelho)".
2. Escrever o teste e confirmar que ele falha pelo motivo certo.
3. Escrever o mínimo de código para o teste passar e mover o cartão para "Em desenvolvimento (verde)".
4. Refatorar com a suíte toda passando ("Refatoração e revisão").
5. Abrir o pull request. O GitHub Actions roda análise estática, testes e cobertura.
6. O cartão vai para "Concluído" só quando a integração contínua passa (definição de pronto).

## 5. Casos de teste por história

Identificador: `T-<história>-<número>`. Tipo: U = unitário, C = componente (tela), I = integração, R = regras de acesso.

### #3 Criar conta e entrar

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| T-03-01 | U | Cadastro com e-mail em formato inválido | Rejeitado com erro de e-mail inválido |
| T-03-02 | U | Cadastro com senha abaixo do mínimo | Rejeitado com erro de senha fraca |
| T-03-03 | C | Tela de cadastro com campos vazios | Botão de cadastrar desabilitado |
| T-03-04 | I | Cadastro, logout e novo login no emulador | Usuário volta autenticado à tela inicial |
| T-03-05 | U | Login com senha errada | Mensagem genérica, sem dizer se o e-mail existe |

### #4 Registrar ocorrência

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| T-04-01 | U | Ocorrência sem foto | Rejeitada |
| T-04-02 | U | Ocorrência sem localização | Rejeitada |
| T-04-03 | U | Ocorrência sem categoria | Rejeitada |
| T-04-04 | U | Ocorrência com foto, categoria e localização, sem descrição | Aceita (descrição é opcional) |
| T-04-05 | U | Categoria fora da lista (buraco, iluminação, entulho, calçada, alagamento, outros) | Rejeitada |
| T-04-06 | U | Foto com metadados EXIF de GPS | Metadados removidos antes do envio |
| T-04-07 | U | Ocorrência nova | Começa com status "aberta" |
| T-04-08 | C | Ocorrência exibida para outro usuário | Nome do autor não aparece |
| T-04-09 | U | GPS negado pelo usuário (serviço simulado) | Erro claro e registro não enviado |
| T-04-10 | I | Fotografar, categorizar, enviar e ver na lista | Ocorrência salva no Firestore e foto no Storage |

### #5 Lista e mapa

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| T-05-01 | U | Filtro por categoria | Só ocorrências da categoria escolhida |
| T-05-02 | U | Filtro por status | Só ocorrências do status escolhido |
| T-05-03 | U | Ocorrência ocultada pelo moderador | Não aparece para moradores |
| T-05-04 | C | Lista vazia | Mensagem "nenhuma ocorrência" em vez de tela em branco |
| T-05-05 | C | Mapa com três ocorrências | Três marcadores |

### #6 Sugestão de ocorrências semelhantes

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| T-06-01 | U | Mesma categoria a 30 m | Sugerida |
| T-06-02 | U | Mesma categoria a 80 m | Não sugerida (limite de 50 m) |
| T-06-03 | U | Categoria diferente a 10 m | Não sugerida |
| T-06-04 | U | Ocorrência semelhante já resolvida | Não sugerida |
| T-06-05 | C | Sugestão exibida antes do envio | Opções "apoiar esta" e "criar nova" |

### #7 Apoiar ocorrência

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| T-07-01 | U | Primeiro apoio de um usuário | Contador sobe para 1 |
| T-07-02 | U | Segundo apoio do mesmo usuário | Rejeitado, contador não muda |
| T-07-03 | U | Autor tenta apoiar a própria ocorrência | Rejeitado |
| T-07-04 | R | Usuário tenta alterar o contador direto no banco | Escrita negada |

### #8 Moderação

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| T-08-01 | U | Moderador muda "aberta" para "encaminhada" | Aceito |
| T-08-02 | U | "Resolvida" volta para "aberta" sem moderador | Rejeitado |
| T-08-03 | U | Transição fora da sequência permitida | Rejeitada |
| T-08-04 | R | Morador comum tenta mudar o status | Escrita negada |
| T-08-05 | R | Morador comum tenta ocultar uma ocorrência | Escrita negada |
| T-08-06 | U | Moderador oculta registro impróprio | Registro some da lista pública |

### #9 Notificações

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| T-09-01 | U | Status muda | Autor e apoiadores entram na lista de destinatários |
| T-09-02 | U | Status não muda (edição sem troca de status) | Nenhuma notificação |
| T-09-03 | U | Moderador que fez a mudança também é apoiador | Não recebe a própria notificação |

## 6. Segurança e privacidade

Base: OWASP Mobile Top 10 (OWASP FOUNDATION, 2024) e LGPD (BRASIL, 2018).

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| T-SEG-01 | R | Usuário não autenticado lê ocorrências | Negado |
| T-SEG-02 | R | Usuário edita ocorrência de outra pessoa | Negado |
| T-SEG-03 | R | Upload no Storage de arquivo que não é imagem ou acima de 5 MB | Negado |
| T-SEG-04 | U | Dados enviados ao Firestore | Sem e-mail ou nome do autor no documento público |
| T-SEG-05 | Revisão | Chaves e segredos no repositório | Nenhum segredo versionado (verificação no CI) |

## 7. Validação manual em dispositivo real

Feita na Sprint 4, num smartphone Android:

1. Instalar a versão de testes.
2. Criar conta, registrar uma ocorrência real no bairro e conferir foto, categoria e local.
3. Medir com cronômetro o tempo do registro (meta: até 60 segundos).
4. Testar sem internet: o app avisa e não perde o que foi preenchido.
5. Testar com GPS desligado e com permissão de câmera negada.

## 8. Critérios de entrada e de saída

**Entrada de uma história na sprint:** critérios de aceitação escritos no cartão e casos de teste listados neste plano.

**Saída (história pronta):**

- todos os testes da história passando no GitHub Actions;
- nenhum erro do ESLint (`npm run lint`) nem do TypeScript (`npm run typecheck`);
- cobertura de pelo menos 80% nas camadas de domínio e dados, medida pelo Jest (relatório lcov);
- revisão do código feita antes do merge.

## 9. Ambiente

- Node.js 22, Expo SDK 58, React Native e TypeScript, com as mesmas versões no computador e no CI (`package-lock.json`).
- Firebase Emulator Suite para integração e regras de acesso, sem tocar em dados reais.
- GitHub Actions a cada push e pull request: `npm run lint`, `npm run typecheck`, `npm test` com cobertura e o relatório publicado como artefato.
- Smartphone Android próprio para a validação manual.

## 10. Riscos

| Risco | Efeito | O que fazer |
|---|---|---|
| Câmera e GPS difíceis de testar automaticamente | Testes frágeis | Isolar atrás de interfaces e simular com `jest.mock` |
| Emulador do Firebase lento no CI | Pipeline demorado | Rodar integração só em pull requests para o ramo principal |
| Um único desenvolvedor | Revisão de código fraca | Revisar o próprio pull request no dia seguinte, com checklist |
