import { removerMetadados } from '../exif';

/** Monta um segmento JPEG: marcador (2 bytes) + tamanho (2 bytes, inclui ele mesmo) + dados. */
function segmento(marcador: number, dados: number[]): number[] {
  const tamanho = dados.length + 2;
  return [0xff, marcador, tamanho >> 8, tamanho & 0xff, ...dados];
}

const texto = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

const SOI = [0xff, 0xd8];
const EOI = [0xff, 0xd9];
const APP0_JFIF = segmento(0xe0, texto('JFIF\0'));
const APP1_EXIF_GPS = segmento(0xe1, texto('Exif\0\0GPSLatitude=-26.9194;GPSLongitude=-49.0661'));
const APP1_XMP = segmento(0xe1, texto('http://ns.adobe.com/xap/1.0/\0<exif:GPSLatitude>26,55S</exif:GPSLatitude>'));
const APP13_IPTC = segmento(0xed, texto('Photoshop 3.0\0cidade'));
const COMENTARIO = segmento(0xfe, texto('Rua XV'));
const DQT = segmento(0xdb, [0, 1, 2, 3]);
// Depois do SOS vêm os dados comprimidos, que podem conter 0xFF 0x00; precisam ser copiados intactos.
const SOS_E_DADOS = [...segmento(0xda, [1, 2, 3]), 0x12, 0xff, 0x00, 0x34, 0xff, 0xe1, 0x56];

const decodificar = (b: Uint8Array) => Array.from(b, (n) => String.fromCharCode(n)).join('');

describe('removerMetadados (T-04-06)', () => {
  const original = Uint8Array.from([
    ...SOI, ...APP0_JFIF, ...APP1_EXIF_GPS, ...APP1_XMP, ...APP13_IPTC, ...COMENTARIO, ...DQT, ...SOS_E_DADOS, ...EOI,
  ]);

  it('remove o EXIF com coordenadas de GPS', () => {
    const limpo = decodificar(removerMetadados(original));

    expect(limpo).not.toContain('GPS');
    expect(limpo).not.toContain('Exif');
  });

  it('remove XMP, IPTC e comentários, que também podem conter o local', () => {
    const limpo = decodificar(removerMetadados(original));

    expect(limpo).not.toContain('adobe');
    expect(limpo).not.toContain('Photoshop');
    expect(limpo).not.toContain('Rua XV');
  });

  it('mantém a imagem em si byte a byte', () => {
    expect(Array.from(removerMetadados(original))).toEqual([...SOI, ...APP0_JFIF, ...DQT, ...SOS_E_DADOS, ...EOI]);
  });

  it('devolve igual uma foto que já não tem metadados', () => {
    const semMetadados = Uint8Array.from([...SOI, ...APP0_JFIF, ...DQT, ...SOS_E_DADOS, ...EOI]);

    expect(Array.from(removerMetadados(semMetadados))).toEqual(Array.from(semMetadados));
  });

  it('recusa arquivo que não é JPEG', () => {
    expect(() => removerMetadados(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toThrow('A foto precisa estar em JPEG');
  });

  it('recusa JPEG truncado', () => {
    expect(() => removerMetadados(Uint8Array.from([...SOI, 0xff, 0xe1, 0x00, 0x40, 0x01]))).toThrow('Foto corrompida');
  });
});
