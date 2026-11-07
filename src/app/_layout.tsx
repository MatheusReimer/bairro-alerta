import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, useFonts } from '@expo-google-fonts/geist';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { Carregando } from '../componentes/ui';
import { AmbienteProvider } from '../contexto/ambiente';
import { criarAmbienteReal } from '../plataforma/ambienteReal';

export default function RootLayout() {
  const [ambiente] = useState(criarAmbienteReal);
  // Se a fonte falhar, o app segue com a fonte do sistema em vez de travar na tela de carregamento.
  const [fontesProntas, erroFontes] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    BricolageGrotesque_700Bold,
  });
  if (!fontesProntas && !erroFontes) return <Carregando />;
  return (
    <AmbienteProvider ambiente={ambiente}>
      <StatusBar style="auto" />
      <Slot />
    </AmbienteProvider>
  );
}
