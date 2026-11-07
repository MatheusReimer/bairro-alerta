// Gera src/componentes/icones-dados.ts com os caminhos SVG só dos ícones Phosphor usados no app.
// Importar o phosphor-react-native inteiro levaria ~18 MB de ícones para o build web.
// Uso: node scripts/gerar-icones.mjs   (requer phosphor-react-native em devDependencies)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ICONES = {
  ArrowFatUp: 'apoio',
  ArrowRight: 'avancar',
  ArrowUpRight: 'expandir',
  Bell: 'aviso',
  Camera: 'camera',
  CaretDown: 'abrir',
  CaretLeft: 'voltar',
  CaretRight: 'seguir',
  Check: 'feito',
  CheckCircle: 'confirmado',
  DotsThreeCircle: 'outros',
  EnvelopeSimple: 'email',
  Eye: 'olho',
  EyeSlash: 'oculto',
  Footprints: 'calcada',
  House: 'inicio',
  ImageSquare: 'galeria',
  Info: 'info',
  LightbulbFilament: 'iluminacao',
  ListBullets: 'lista',
  LockSimple: 'senha',
  MapPin: 'local',
  MapTrifold: 'mapa',
  NotePencil: 'descricao',
  Plus: 'mais',
  SealCheck: 'associacao',
  ShieldCheck: 'privacidade',
  SignOut: 'sair',
  TrafficCone: 'buraco',
  TrashSimple: 'entulho',
  UsersThree: 'vizinhos',
  WarningCircle: 'alerta',
  Waves: 'alagamento',
  X: 'fechar',
};
const PESOS = ['regular', 'bold', 'fill', 'duotone'];
const DEFS = join('node_modules', 'phosphor-react-native', 'lib', 'module', 'defs');

const dados = {};
for (const [arquivo, nome] of Object.entries(ICONES)) {
  const fonte = readFileSync(join(DEFS, `${arquivo}.js`), 'utf8');
  const partes = fonte.split(/\['(bold|duotone|fill|light|regular|thin)',/).slice(1);
  dados[nome] = {};
  for (let i = 0; i < partes.length; i += 2) {
    const peso = partes[i];
    if (!PESOS.includes(peso)) continue;
    const caminhos = [...partes[i + 1].matchAll(/d: "([^"]+)"/g)].map((m) => m[1]);
    // No duotone o primeiro caminho é o fundo translúcido e o segundo, o contorno.
    dados[nome][peso] = caminhos;
  }
}

const saida = `// GERADO por scripts/gerar-icones.mjs a partir do phosphor-react-native. Não edite à mão.
// Ícones Phosphor (https://phosphoricons.com), licença MIT.
export const caminhos = ${JSON.stringify(dados)} as const;

export type NomeIcone = keyof typeof caminhos;
`;
writeFileSync(join('src', 'componentes', 'icones-dados.ts'), saida);
console.log(`${Object.keys(dados).length} ícones gerados.`);
