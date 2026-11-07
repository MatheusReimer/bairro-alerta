// O MapLibre depende de código nativo. Nos testes, o mapa e a câmera viram Views simples e cada marcador vira um
// botão que repassa testID, rótulos de acessibilidade e o toque, para contar os pontos e tocar neles.
type PropsSimulado = { children?: unknown; testID?: string; accessibilityLabel?: string };

jest.mock('@maplibre/maplibre-react-native', () => {
  const { Pressable, View } = require('react-native');
  const Simples = ({ children, testID, accessibilityLabel }: PropsSimulado) => (
    <View testID={testID} accessibilityLabel={accessibilityLabel}>
      {children as never}
    </View>
  );
  const Vazio = () => null;
  const Marker = ({ children, onPress, id, ...resto }: PropsSimulado & { id?: string; onPress?: (e: unknown) => void }) => (
    <Pressable {...resto} onPress={() => onPress?.({ nativeEvent: { id } })}>
      {children as never}
    </Pressable>
  );
  return { __esModule: true, Map: Simples, Camera: Vazio, NativeUserLocation: Vazio, Marker };
});
