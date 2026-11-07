import { Redirect, Stack } from 'expo-router';

import { useTema } from '../componentes/tema';
import { Carregando } from '../componentes/ui';
import { useAmbiente } from '../contexto/ambiente';

/**
 * Área logada: quem não entrou é levado para a tela de entrar. Cada tela desenha o próprio cabeçalho em widgets
 * (voltar, fechar, título grande); a barra flutuante fica na tela inicial, onde alterna lista e mapa.
 */
export function AppLayout() {
  const { usuario, carregandoUsuario } = useAmbiente();
  const t = useTema();
  if (carregandoUsuario) return <Carregando />;
  if (!usuario) return <Redirect href="/entrar" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.cores.fundo } }}>
      <Stack.Screen name="index" options={{ title: 'Ocorrências do bairro' }} />
      <Stack.Screen name="nova" options={{ title: 'Nova ocorrência' }} />
      <Stack.Screen name="ocorrencia/[id]" options={{ title: 'Ocorrência' }} />
      <Stack.Screen name="avisos" options={{ title: 'Avisos' }} />
    </Stack>
  );
}
