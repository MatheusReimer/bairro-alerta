import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

import { criarAuth } from './firebaseAuth';

/**
 * Configuração vinda de variáveis EXPO_PUBLIC_* (arquivo .env, fora do git). Essas chaves do Firebase
 * identificam o projeto e não são segredo; a proteção real está nas regras do Firestore e do Storage.
 * Com EXPO_PUBLIC_USE_EMULATORS=1 o app usa o Firebase Emulator Suite e um projeto "demo" sem dados reais.
 */
const usarEmuladores = process.env.EXPO_PUBLIC_USE_EMULATORS === '1';

const config = usarEmuladores
  ? { apiKey: 'demo-key', projectId: 'demo-bairro-alerta', storageBucket: 'demo-bairro-alerta.appspot.com', appId: 'demo' }
  : {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

export type ServicosFirebase = { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage };

let servicos: ServicosFirebase | null = null;

export function firebase(): ServicosFirebase {
  if (servicos) return servicos;
  const jaIniciado = getApps().length > 0;
  const app = jaIniciado ? getApp() : initializeApp(config);
  const auth = criarAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  if (usarEmuladores && !jaIniciado) {
    // No emulador Android, 10.0.2.2 é o computador. Num celular real, use o IP do computador na rede.
    const host = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8181);
    connectStorageEmulator(storage, host, 9199);
  }
  servicos = { app, auth, db, storage };
  return servicos;
}
