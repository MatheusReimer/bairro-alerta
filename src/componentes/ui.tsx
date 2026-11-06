import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Status } from '../domain/ocorrencia';

/** Paleta do protótipo da Etapa 1 (design/prototipo.html). */
export const cores = {
  azul: '#2E74B5',
  azulEscuro: '#1F4E79',
  azulClaro: '#DEEAF6',
  fundo: '#f4f6f9',
  texto: '#1d2733',
  cinza: '#5f6b78',
  borda: '#e3e8ee',
  verde: '#2e8b57',
  amarelo: '#9a6a00',
  vermelho: '#c0392b',
  branco: '#ffffff',
};

export const corDoStatus: Record<Status, string> = {
  aberta: cores.vermelho,
  encaminhada: cores.amarelo,
  em_andamento: cores.azul,
  resolvida: cores.verde,
};

type BotaoProps = {
  titulo: string;
  aoPressionar: () => void;
  variante?: 'primario' | 'secundario' | 'perigo';
  desabilitado?: boolean;
  carregando?: boolean;
  rotulo?: string;
  estilo?: StyleProp<ViewStyle>;
};

export function Botao({ titulo, aoPressionar, variante = 'primario', desabilitado, carregando, rotulo, estilo }: BotaoProps) {
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      disabled={inativo}
      onPress={aoPressionar}
      style={({ pressed }) => [
        estilos.botao,
        variante === 'primario' && estilos.primario,
        variante === 'secundario' && estilos.secundario,
        variante === 'perigo' && estilos.perigo,
        inativo && estilos.inativo,
        pressed && { opacity: 0.8 },
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={variante === 'primario' ? cores.branco : cores.azul} />
      ) : (
        <Text style={[estilos.textoBotao, variante !== 'primario' && { color: variante === 'perigo' ? cores.vermelho : cores.azul }]}>
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

type ChipProps = { texto: string; selecionado: boolean; aoPressionar: () => void; rotulo?: string };

export function Chip({ texto, selecionado, aoPressionar, rotulo }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? texto}
      accessibilityState={{ selected: selecionado }}
      onPress={aoPressionar}
      style={[estilos.chip, selecionado && estilos.chipSelecionado]}
    >
      <Text style={[estilos.textoChip, selecionado && { color: cores.branco }]}>{texto}</Text>
    </Pressable>
  );
}

export function Selo({ texto, cor }: { texto: string; cor: string }) {
  return (
    <View style={[estilos.selo, { borderColor: cor }]}>
      <Text style={[estilos.textoSelo, { color: cor }]}>{texto}</Text>
    </View>
  );
}

export function Mensagem({ texto, tipo = 'info' }: { texto: string; tipo?: 'info' | 'erro' | 'sucesso' }) {
  const cor = tipo === 'erro' ? cores.vermelho : tipo === 'sucesso' ? cores.verde : cores.azulEscuro;
  return (
    <View accessibilityRole={tipo === 'erro' ? 'alert' : 'text'} style={[estilos.mensagem, { borderLeftColor: cor }]}>
      <Text style={{ color: cores.texto }}>{texto}</Text>
    </View>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.secao}>
      <Text accessibilityRole="header" style={estilos.tituloSecao}>
        {titulo}
      </Text>
      {children}
    </View>
  );
}

export function Carregando() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.fundo }}>
      <ActivityIndicator size="large" color={cores.azul} accessibilityLabel="Carregando" />
    </View>
  );
}

export function textoApoios(n: number): string {
  if (n === 0) return 'Nenhum apoio ainda';
  return n === 1 ? '1 apoio' : `${n} apoios`;
}

export function dataCurta(ms: number): string {
  const d = new Date(ms);
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const estilos = StyleSheet.create({
  botao: { minHeight: 48, borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  primario: { backgroundColor: cores.azul },
  secundario: { backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.azul },
  perigo: { backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.vermelho },
  inativo: { opacity: 0.45 },
  textoBotao: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.branco,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelecionado: { backgroundColor: cores.azul, borderColor: cores.azul },
  textoChip: { color: cores.texto, fontSize: 14 },
  selo: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  textoSelo: { fontSize: 12, fontWeight: '600' },
  mensagem: { backgroundColor: cores.branco, borderLeftWidth: 4, padding: 12, borderRadius: 6, marginVertical: 8 },
  secao: { marginTop: 20 },
  tituloSecao: { fontSize: 16, fontWeight: '700', color: cores.azulEscuro, marginBottom: 8 },
});
