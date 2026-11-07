import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Completa o app.json com o que depende do ambiente de build.
 * A chave do Google Maps (Android) vem da variável GOOGLE_MAPS_ANDROID_API_KEY, definida no EAS
 * e nunca versionada. Sem ela o app compila, mas o mapa nativo fica em branco.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Bairro Alerta',
  slug: config.slug ?? 'bairro-alerta',
  android: {
    ...config.android,
    package: 'br.univali.bairroalerta',
  },
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
});
