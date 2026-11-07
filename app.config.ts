import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Completa o app.json com o que depende do ambiente de build.
 * O mapa nativo usa o MapLibre com os mapas gratuitos do OpenFreeMap: não há chave de API nem conta de cobrança.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Bairro Alerta',
  slug: config.slug ?? 'bairro-alerta',
  android: {
    ...config.android,
    package: 'br.univali.bairroalerta',
  },
  plugins: [...(config.plugins ?? []), '@maplibre/maplibre-react-native'],
});
