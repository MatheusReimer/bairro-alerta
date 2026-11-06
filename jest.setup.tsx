// react-native-maps depende de código nativo. Nos testes, cada componente vira uma View simples,
// mantendo o testID dos marcadores para contar os pontos no mapa.
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const Simples = ({ children, testID }: { children?: unknown; testID?: string }) => <View testID={testID}>{children as never}</View>;
  return { __esModule: true, default: Simples, Marker: Simples, Callout: Simples };
});
