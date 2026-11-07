import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Status } from '../domain/ocorrencia';
import { Icone, type NomeIcone } from './icones';
import { fontes, useEstilos, useTema, type Par, type Tema } from './tema';

type BotaoProps = {
  titulo: string;
  aoPressionar: () => void;
  variante?: 'primario' | 'secundario' | 'perigo' | 'fantasma';
  desabilitado?: boolean;
  carregando?: boolean;
  rotulo?: string;
  icone?: NomeIcone;
  iconeDepois?: NomeIcone;
  estilo?: StyleProp<ViewStyle>;
};

/** Botão em pílula: lima para a ação principal, branco para as secundárias. */
export function Botao({
  titulo,
  aoPressionar,
  variante = 'primario',
  desabilitado,
  carregando,
  rotulo,
  icone,
  iconeDepois,
  estilo,
}: BotaoProps) {
  const t = useTema();
  const e = useEstilos(criarEstilos);
  const inativo = desabilitado || carregando;
  const corTexto =
    variante === 'primario' ? t.cores.sobreDestaque : variante === 'perigo' ? t.cores.erro : variante === 'fantasma' ? t.cores.suave : t.cores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      disabled={inativo}
      onPress={aoPressionar}
      style={({ pressed }) => [
        e.botao,
        variante === 'primario' && e.primario,
        variante === 'secundario' && e.secundario,
        variante === 'perigo' && e.perigo,
        variante === 'fantasma' && e.fantasma,
        inativo && e.inativo,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <View style={e.conteudoBotao}>
          {icone ? <Icone nome={icone} cor={corTexto} tamanho={18} peso="bold" /> : null}
          <Text style={[e.textoBotao, { color: corTexto }]}>{titulo}</Text>
          {iconeDepois ? <Icone nome={iconeDepois} cor={corTexto} tamanho={18} peso="bold" /> : null}
        </View>
      )}
    </Pressable>
  );
}

type BotaoRedondoProps = {
  icone: NomeIcone;
  rotulo: string;
  aoPressionar: () => void;
  tamanho?: number;
  /** Fundo translúcido, para ficar sobre fotos. */
  sobreFoto?: boolean;
  children?: ReactNode;
  estilo?: StyleProp<ViewStyle>;
};

/** Botão circular só com ícone (voltar, fechar, avisos, sair). O rótulo é o que o leitor de tela anuncia. */
export function BotaoRedondo({ icone, rotulo, aoPressionar, tamanho = 48, sobreFoto, children, estilo }: BotaoRedondoProps) {
  const t = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={aoPressionar}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: sobreFoto ? 'rgba(255,255,255,0.92)' : t.cores.cartao,
        },
        pressed && { opacity: 0.8 },
        estilo,
      ]}
    >
      <Icone nome={icone} cor={sobreFoto ? '#161616' : t.cores.texto} tamanho={20} peso="bold" />
      {children}
    </Pressable>
  );
}

type ChipProps = {
  texto: string;
  selecionado: boolean;
  aoPressionar: () => void;
  rotulo?: string;
  /** Menor, para filtros que aparecem em grupo. */
  compacto?: boolean;
  estilo?: StyleProp<ViewStyle>;
};

/** Chip de escolha: contorno quando livre, grafite com um visto em lima quando escolhido. */
export function Chip({ texto, selecionado, aoPressionar, rotulo, compacto, estilo }: ChipProps) {
  const t = useTema();
  const e = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? texto}
      accessibilityState={{ selected: selecionado }}
      onPress={aoPressionar}
      hitSlop={compacto ? 4 : undefined}
      style={({ pressed }) => [e.chip, compacto && e.chipCompacto, selecionado && e.chipSelecionado, pressed && { opacity: 0.8 }, estilo]}
    >
      {selecionado ? <Icone nome="feito" cor={t.cores.chipAtivoIcone} tamanho={compacto ? 13 : 15} peso="bold" /> : null}
      <Text style={[e.textoChip, compacto && e.textoChipCompacto, selecionado && e.textoChipSelecionado]}>{texto}</Text>
    </Pressable>
  );
}

/** Rótulos curtos do status, para os selos (o rótulo completo continua no histórico e nos filtros). */
export const ROTULO_CURTO_STATUS: Record<Status, string> = {
  aberta: 'Aberta',
  encaminhada: 'Na prefeitura',
  em_andamento: 'Em andamento',
  resolvida: 'Resolvida',
};

/** Selo em pílula: texto e fundo de um par de cores do tema. */
export function Selo({ texto, par, estilo }: { texto: string; par: Par; estilo?: StyleProp<ViewStyle> }) {
  const e = useEstilos(criarEstilos);
  return (
    <View style={[e.selo, { backgroundColor: par.fundo }, estilo]}>
      <Text style={[e.textoSelo, { color: par.texto }]}>{texto}</Text>
    </View>
  );
}

export function Mensagem({
  texto,
  tipo = 'info',
  estilo,
}: {
  texto: string;
  tipo?: 'info' | 'erro' | 'sucesso';
  estilo?: StyleProp<ViewStyle>;
}) {
  const t = useTema();
  const e = useEstilos(criarEstilos);
  const icone: NomeIcone = tipo === 'erro' ? 'alerta' : tipo === 'sucesso' ? 'feito' : 'info';
  const fundoIcone = tipo === 'erro' ? t.cores.erroFundo : tipo === 'sucesso' ? t.cores.destaque : t.cores.fundo;
  const corIcone = tipo === 'erro' ? t.cores.erro : tipo === 'sucesso' ? t.cores.sobreDestaque : t.cores.texto;
  return (
    <View accessibilityRole={tipo === 'erro' ? 'alert' : 'text'} style={[e.mensagem, estilo]}>
      <View style={[e.iconeMensagem, { backgroundColor: fundoIcone }]}>
        <Icone nome={icone} cor={corIcone} tamanho={16} peso="bold" />
      </View>
      <Text style={[e.textoMensagem, tipo === 'erro' && { color: t.cores.erro }]}>{texto}</Text>
    </View>
  );
}

/** Widget: bloco branco arredondado, a unidade de layout do app. */
export function Widget({ titulo, children, estilo }: { titulo?: string; children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  const e = useEstilos(criarEstilos);
  return (
    <View style={[e.widget, estilo]}>
      {titulo ? (
        <Text accessibilityRole="header" style={e.tituloWidget}>
          {titulo}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function Carregando() {
  const t = useTema();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.cores.fundo }}>
      <ActivityIndicator size="large" color={t.cores.texto} accessibilityLabel="Carregando" />
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

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    botao: { minHeight: 56, borderRadius: 28, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
    conteudoBotao: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    primario: { backgroundColor: c.destaque },
    secundario: { backgroundColor: c.cartao, borderWidth: 1.5, borderColor: c.borda },
    perigo: { backgroundColor: c.erroFundo },
    fantasma: { backgroundColor: 'transparent', minHeight: 48 },
    inativo: { opacity: 0.4 },
    textoBotao: { fontSize: 15.5, fontFamily: fontes.semi },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      minHeight: 40,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: c.borda,
      backgroundColor: c.cartao,
    },
    chipCompacto: { paddingHorizontal: 11, minHeight: 34, gap: 4 },
    chipSelecionado: { backgroundColor: c.chipAtivo, borderColor: c.chipAtivo },
    textoChip: { color: c.texto, fontSize: 14, fontFamily: fontes.media },
    textoChipCompacto: { fontSize: 13 },
    textoChipSelecionado: { color: c.chipAtivoTexto, fontFamily: fontes.semi },
    selo: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
    textoSelo: { fontSize: 12, fontFamily: fontes.semi },
    mensagem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.cartao,
      padding: 12,
      borderRadius: 20,
      marginVertical: 6,
    },
    iconeMensagem: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    textoMensagem: { color: c.texto, fontSize: 14, fontFamily: fontes.media, flex: 1, lineHeight: 20 },
    widget: { backgroundColor: c.cartao, borderRadius: 26, padding: 16 },
    tituloWidget: { fontSize: 17, fontFamily: fontes.titulo, color: c.texto, marginBottom: 10, letterSpacing: -0.2 },
  });
