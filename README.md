# Bairro Alerta

Aplicativo mobile para moradores registrarem e acompanharem problemas de infraestrutura do bairro
(buracos, iluminação, entulho, calçadas, alagamentos). A associação de moradores modera e encaminha
as demandas ao poder público.

Projeto acadêmico (UNIVALI, Análise e Desenvolvimento de Sistemas), desenvolvido com TDD e Scrum.

## Tecnologias

- React Native com Expo (SDK 58) e TypeScript
- Jest (`jest-expo`) e React Native Testing Library para testes unitários e de componente
- Maestro para testes ponta a ponta (a partir da Sprint 4)
- Firebase (Auth, Firestore, Storage, Cloud Messaging) com o Emulator Suite nos testes
- GitHub Actions: lint, verificação de tipos, testes e cobertura a cada push e pull request

## Como rodar

Requer Node.js 22.

```bash
npm install
npm start          # abre o Expo; leia o QR code com o app Expo Go no Android
npm test           # testes com relatório de cobertura em coverage/
npm run lint
npm run typecheck
```

## Documentos

- [Plano de testes](docs/plano-de-testes.md)
- Quadro Scrum: Trello "Bairro Alerta - Scrum"

## Fluxo de trabalho

1. Escrever o teste que falha (cartão em "Teste escrito (vermelho)" no Trello).
2. Implementar o mínimo para passar ("Em desenvolvimento (verde)").
3. Refatorar com os testes passando e abrir o pull request.
4. O cartão só vai para "Concluído" quando o CI passa.
