import { router } from 'expo-router';

/** Volta para a tela anterior ou, se a tela foi aberta direto por um link, para a inicial. */
export function voltar() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
