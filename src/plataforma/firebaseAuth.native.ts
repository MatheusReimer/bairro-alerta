import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
// getReactNativePersistence só existe no pacote "react-native" do firebase/auth, que o Metro escolhe no
// celular. Os tipos padrão (web) não o declaram.
// @ts-expect-error export disponível apenas na condição react-native
import { getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

// Celular: mantém a sessão entre aberturas do app usando o AsyncStorage.
export function criarAuth(app: FirebaseApp): Auth {
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}
