import { Slot } from 'expo-router';
import { useState } from 'react';

import { AmbienteProvider } from '../contexto/ambiente';
import { criarAmbienteReal } from '../plataforma/ambienteReal';

export default function RootLayout() {
  const [ambiente] = useState(criarAmbienteReal);
  return (
    <AmbienteProvider ambiente={ambiente}>
      <Slot />
    </AmbienteProvider>
  );
}
