import type { FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, initializeAuth, type Auth } from 'firebase/auth';

// Web: sessão guardada no navegador. A versão para celular está em firebaseAuth.native.ts.
export function criarAuth(app: FirebaseApp): Auth {
  return initializeAuth(app, { persistence: browserLocalPersistence });
}
