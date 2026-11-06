import type { Ambiente } from '../contexto/ambiente';
import { lerFoto, localizacaoExpo, obterFoto } from './dispositivo';
import { firebase } from './firebase';
import { AutenticacaoFirebase, RepositorioFirestore } from './firestore';

/** Liga as telas ao Firebase e aos recursos do aparelho (câmera, GPS). */
export function criarAmbienteReal(): Ambiente {
  const { auth, db } = firebase();
  return {
    autenticacao: new AutenticacaoFirebase(auth, db),
    repositorio: new RepositorioFirestore(db),
    localizacao: localizacaoExpo,
    obterFoto,
    lerFoto,
    agora: () => Date.now(),
  };
}
