/** Quem está agindo no app. `moderador` vem do perfil gravado pela associação, nunca do próprio usuário. */
export type Ator = { uid: string; moderador: boolean };

/** Violação de regra de negócio. A mensagem é mostrada ao morador como está. */
export class ErroRegra extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroRegra';
  }
}
