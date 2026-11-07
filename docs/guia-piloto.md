# Guia do piloto: Bairro Alerta

Piloto de uma semana com moradores do bairro Vila Nova, para validar o aplicativo e medir as métricas de sucesso
(Quadro 7 do relatório da Etapa 1). Grupo 94: Ana Clara, Laura Welter Góes, Matheus Henrique Reimer e Brayan Silveira.

## 1. Calendário sugerido

O relatório final vence em **30/11/2026**. Para sobrar tempo de analisar os dados:

| Quando | O quê |
|---|---|
| até 12/11 | Questionário no ar (uma semana), projeto real do Firebase criado, versão de testes publicada |
| 13/11 | Convite aos participantes (meta: pelo menos 15) e cadastro dos moderadores da associação |
| 14/11 a 21/11 | Piloto: moradores registram e apoiam ocorrências; associação modera e encaminha |
| durante o piloto | Sessão presencial curta com 5 a 8 participantes para cronometrar o registro (Seção 4) |
| 21/11 a 23/11 | Questionário de usabilidade (SUS) e coleta das métricas |
| 24/11 a 29/11 | Relatório final e vídeo da Etapa 2 |

## 2. Antes de começar (equipe)

1. Criar um projeto no Firebase (plano gratuito Spark) e ativar Authentication (e-mail e senha) e Firestore.
   Não é preciso o Storage: as fotos ficam no Firestore.
2. Publicar as regras: `npx firebase deploy --only firestore:rules --project <id-do-projeto>`.
3. Preencher o `.env` com as chaves do app web do projeto e `EXPO_PUBLIC_USE_EMULATORS=0`.
4. Gerar o APK do Android e publicar a versão web para iPhone (ver Seção 3).
5. Cadastrar os moderadores: depois que a pessoa da associação criar a conta no app, copiar o UID dela em
   Authentication e criar no Firestore o documento `moderadores/<UID>` com o campo `nome`.
6. Fazer um teste completo com dois celulares antes de convidar os moradores.
7. Antes do convite, cada integrante da equipe registra no app 3 ou 4 problemas reais do bairro, com foto no local,
   e apoia ("Eu também vi") os registros dos colegas que também viu. Assim o primeiro morador já encontra um mapa
   com atividade real. No relatório, informe que os primeiros registros foram feitos pela equipe.
8. Já foram registrados 7 problemas do bairro noticiados pela imprensa (ND Mais e O Blumenauense), com a foto, a data
   e a fonte da notícia, pelo script local `noticias/importar.mjs` (fora do git, porque as fotos são de terceiros).
   Eles não entram nas métricas do piloto; `node noticias/importar.mjs apagar` remove todos.

## 3. Como os moradores instalam

**Android (principal):** o piloto usa o aplicativo Android, gerado pelo EAS Build (perfil `preview` do `eas.json`,
que produz um `.apk` de distribuição interna):

```
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

O EAS devolve um link de instalação. Mande o link no grupo (ou gere um QR code dele). No celular, o morador abre
o link, baixa o arquivo e aceita o aviso de "instalar apps desconhecidos", porque o app não vem da Play Store.

Antes do primeiro build:

1. As chaves do Firebase ficam no `.env`, que não vai para o git nem para o EAS. Cadastre as mesmas variáveis
   `EXPO_PUBLIC_*` como variáveis de ambiente do projeto no EAS (painel do Expo ou `eas env:create`).
2. O mapa do app usa o MapLibre com os mapas do OpenFreeMap (dados do OpenStreetMap): é gratuito, não precisa
   de chave de API nem de conta de cobrança, então não há nada a configurar. Os créditos obrigatórios
   ("OpenFreeMap © OpenMapTiles © OpenStreetMap") aparecem no canto do mapa.

**iPhone (alternativa):** instalar no iPhone exige o programa pago da Apple, então quem usa iPhone continua com a
versão web, publicada no Firebase Hosting:

```
npm run publicar
```

O morador abre `https://<id-do-projeto>.web.app` no navegador e toca em Compartilhar > Adicionar à tela inicial.
Câmera e GPS funcionam pelo navegador; o mapa aparece como lista de pontos com link para o OpenStreetMap.

## 4. Roteiro para os participantes

Mensagem para enviar no grupo:

> Olá! Obrigado por participar do piloto do **Bairro Alerta**. Durante esta semana:
> 1. Instale o app pelo link e crie sua conta com e-mail e senha.
> 2. Quando vir um problema no bairro (buraco, poste apagado, entulho, calçada quebrada, alagamento), toque em
>    **Registrar problema**, tire a foto, escolha a categoria e envie. O local é marcado pelo GPS.
> 3. Se o app avisar que já existe um registro parecido, toque em **Apoiar esta**: isso mostra à prefeitura que
>    mais gente é afetada.
> 4. Veja os registros dos vizinhos e toque em **Eu também vi este problema** quando for o caso.
> 5. Acompanhe o andamento pelo sino 🔔: você recebe um aviso quando a associação encaminhar ou resolver.
>
> Seu nome e seu e-mail não aparecem para ninguém, e a foto é enviada sem a localização embutida pelo celular.
> No fim da semana vamos mandar um questionário rápido de 10 perguntas.

### Sessão cronometrada (métrica "Facilidade de uso", meta: até 60 s)

Com 5 a 8 participantes, pessoalmente, em um ponto do bairro com um problema real:

1. Com o app já aberto na lista, diga: "registre este problema". Comece o cronômetro.
2. Pare quando aparecer "Ocorrência registrada. Obrigado!".
3. Não ajude durante a tarefa. Anote o tempo, o modelo do celular e qualquer dificuldade observada.

| Participante | Faixa etária | Celular | Tempo (s) | Precisou de ajuda? | Observações |
|---|---|---|---|---|---|
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |
| P4 | | | | | |
| P5 | | | | | |

## 5. Questionário de usabilidade (SUS)

System Usability Scale (BROOKE, 1996). Enviar no Google Forms ao fim do piloto, anônimo. Cada afirmação tem escala de
1 (discordo totalmente) a 5 (concordo totalmente).

1. Eu acho que gostaria de usar este aplicativo com frequência.
2. Eu achei o aplicativo desnecessariamente complexo.
3. Eu achei o aplicativo fácil de usar.
4. Eu acho que precisaria de ajuda de uma pessoa com conhecimentos técnicos para usar o aplicativo.
5. Eu achei que as funções do aplicativo estão bem integradas.
6. Eu achei que o aplicativo tem muitas inconsistências.
7. Eu imagino que a maioria das pessoas aprenderia a usar este aplicativo rapidamente.
8. Eu achei o aplicativo muito complicado de usar.
9. Eu me senti muito confiante usando o aplicativo.
10. Eu precisei aprender várias coisas antes de conseguir usar o aplicativo.

Pergunta aberta opcional: "O que você mudaria no aplicativo?" (as respostas viram itens do backlog).

**Cálculo da nota (0 a 100):** nos itens ímpares, nota − 1; nos pares, 5 − nota; some tudo e multiplique por 2,5.
A nota do piloto é a média dos participantes. Meta: 70 ou mais.

## 6. Coleta das métricas (fim do piloto)

| Métrica (Quadro 7) | Onde buscar | Meta |
|---|---|---|
| Adoção pela comunidade | Firebase Console > Authentication: número de usuários, sem contar a equipe e os moderadores | ≥ 15 moradores |
| Uso efetivo | Firestore > coleção `ocorrencias`: total de documentos | ≥ 20 ocorrências |
| Facilidade de uso | Tabela da sessão cronometrada (Seção 4): média dos tempos | ≤ 60 s |
| Satisfação | Média das notas SUS (Seção 5) | ≥ 70 |
| Redução do problema | No app, como moderador: filtros de status. (encaminhadas + em andamento + resolvidas) ÷ total | ≥ 50% |
| Cobertura de testes | Artefato "cobertura" do GitHub Actions | ≥ 80% |
| Estabilidade da suíte | Aba Actions do GitHub: execuções no ramo `main` | 100% aprovadas na entrega |

Tire prints de cada número (Console do Firebase, Actions, planilhas). Eles entram no relatório como evidência.

## 7. Para a associação de moradores (moderação)

- Entre no app com a conta de moderador: aparece "Moderação da associação" no topo.
- Abra cada ocorrência nova e, depois de encaminhar à prefeitura (156, ofício ou aplicativo da prefeitura), toque em
  **Marcar como Encaminhada à prefeitura**. Quem registrou e quem apoiou recebe um aviso.
- Atualize para **Em andamento** e **Resolvida** conforme a prefeitura responder.
- Registro impróprio (propaganda, ofensa, foto de pessoas): **Ocultar dos moradores**. Dá para desfazer.

## 8. Termo de participação

> Concordo em participar voluntariamente do piloto do aplicativo Bairro Alerta, trabalho acadêmico de extensão de
> estudantes da UNIVALI. Sei que meu e-mail serve apenas para entrar no aplicativo e não é mostrado a outros
> moradores, que as fotos são enviadas sem a localização embutida e que os dados serão usados apenas neste trabalho,
> de forma agrupada e anônima, conforme a LGPD (Lei nº 13.709/2018). Posso sair a qualquer momento e pedir a
> exclusão da minha conta e dos meus registros pelo grupo do projeto.

(No Google Forms de inscrição, use uma caixa de seleção obrigatória "Li e concordo".)
