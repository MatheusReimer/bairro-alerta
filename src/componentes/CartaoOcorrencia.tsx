import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROTULO_STATUS, rotuloCategoria, type Ocorrencia } from '../domain/ocorrencia';
import { Icone, iconeDaCategoria } from './icones';
import { fontes, useEstilos, useTema, type Tema } from './tema';
import { ROTULO_CURTO_STATUS, Selo, textoApoios } from './ui';

type Props = {
  ocorrencia: Ocorrencia;
  aoPressionar: () => void;
  extra?: string;
  /** Linha divisória acima, quando a linha não é a primeira do widget. */
  divisoria?: boolean;
  /** Fundo da miniatura: o do widget onde a linha está. */
  sobreFundo?: boolean;
};

/** Linha de ocorrência dentro de um widget. Não mostra o autor (LGPD). */
export function CartaoOcorrencia({ ocorrencia: o, aoPressionar, extra, divisoria, sobreFundo }: Props) {
  const t = useTema();
  const e = useEstilos(criarEstilos);
  const categoria = rotuloCategoria(o.categoria);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${categoria}: ${o.descricao || 'sem descrição'}. ${ROTULO_STATUS[o.status]}, ${textoApoios(o.apoios)}`}
      onPress={aoPressionar}
      style={({ pressed }) => [e.linha, divisoria && e.divisoria, pressed && { opacity: 0.7 }]}
    >
      <View style={[e.miniatura, sobreFundo && { backgroundColor: t.cores.cartao }]}>
        <Icone nome={iconeDaCategoria[o.categoria]} cor={t.cores.texto} tamanho={22} peso="bold" />
      </View>
      <View style={e.corpo}>
        <Text style={e.titulo} numberOfLines={2}>
          {o.descricao || categoria}
        </Text>
        <View style={e.meta}>
          {o.descricao ? (
            <>
              <Text style={e.textoMeta}>{categoria}</Text>
              <Text style={e.textoMeta}>·</Text>
            </>
          ) : null}
          <Text style={e.textoMeta}>{textoApoios(o.apoios)}</Text>
          {extra ? (
            <>
              <Text style={e.textoMeta}>·</Text>
              <Text style={e.textoMeta}>{extra}</Text>
            </>
          ) : null}
        </View>
        {o.oculta ? <Selo texto="Oculta" par={{ fundo: t.cores.erroFundo, texto: t.cores.erro }} estilo={{ marginTop: 4 }} /> : null}
      </View>
      <Selo texto={ROTULO_CURTO_STATUS[o.status]} par={t.status[o.status]} estilo={{ alignSelf: 'center' }} />
    </Pressable>
  );
}

const criarEstilos = ({ cores: c }: Tema) =>
  StyleSheet.create({
    linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    divisoria: { borderTopWidth: 1, borderTopColor: c.linha },
    miniatura: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo },
    corpo: { flex: 1, minWidth: 0 },
    titulo: { color: c.texto, fontSize: 15, fontFamily: fontes.semi, lineHeight: 20 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 1 },
    textoMeta: { color: c.suave, fontSize: 12.5, fontFamily: fontes.regular },
  });
