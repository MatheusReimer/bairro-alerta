import Svg, { Path } from 'react-native-svg';

import type { Categoria } from '../domain/ocorrencia';
import { caminhos, type NomeIcone } from './icones-dados';

export type PesoIcone = 'regular' | 'bold' | 'fill' | 'duotone';
export type { NomeIcone };

type Props = { nome: NomeIcone; cor: string; tamanho?: number; peso?: PesoIcone };

/** Ícone Phosphor decorativo: o texto ao lado (ou o rótulo do botão) é o que o leitor de tela anuncia. */
export function Icone({ nome, cor, tamanho = 20, peso = 'regular' }: Props) {
  const d = caminhos[nome][peso];
  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 256 256"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
      {peso === 'duotone' ? (
        <>
          <Path d={d[0]} fill={cor} opacity={0.22} />
          <Path d={d[1]} fill={cor} />
        </>
      ) : (
        <Path d={d[0]} fill={cor} />
      )}
    </Svg>
  );
}

export const iconeDaCategoria: Record<Categoria, NomeIcone> = {
  buraco: 'buraco',
  iluminacao: 'iluminacao',
  entulho: 'entulho',
  calcada: 'calcada',
  alagamento: 'alagamento',
  outros: 'outros',
};
