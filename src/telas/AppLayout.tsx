import { Redirect, Stack } from 'expo-router';

import { cores, Carregando } from '../componentes/ui';
import { useAmbiente } from '../contexto/ambiente';

/** Área logada: quem não entrou é levado para a tela de entrar. */
export function AppLayout() {
  const { usuario, carregandoUsuario } = useAmbiente();
  if (carregandoUsuario) return <Carregando />;
  if (!usuario) return <Redirect href="/entrar" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.azul },
        headerTintColor: cores.branco,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="nova" options={{ title: 'Nova ocorrência' }} />
      <Stack.Screen name="ocorrencia/[id]" options={{ title: 'Ocorrência' }} />
      <Stack.Screen name="avisos" options={{ title: 'Avisos' }} />
    </Stack>
  );
}
