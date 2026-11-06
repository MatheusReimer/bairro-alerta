// Segmentos que podem carregar o local onde a foto foi tirada ou dados pessoais:
// APP1 (EXIF e XMP), APP13 (IPTC/Photoshop) e COM (comentário). APP0 (JFIF) e APP2 (perfil de cor) ficam.
const MARCADORES_REMOVIDOS = new Set([0xe1, 0xed, 0xfe]);
const SOS = 0xda;
const EOI = 0xd9;

function semTamanho(marcador: number): boolean {
  return marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7);
}

/**
 * Remove os metadados de uma foto JPEG antes do envio (LGPD: a foto não pode revelar onde o morador
 * estava além do ponto que ele mesmo marcou). Os bytes da imagem são copiados sem alteração.
 */
export function removerMetadados(jpeg: Uint8Array): Uint8Array {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error('A foto precisa estar em JPEG');

  const saida: number[] = [0xff, 0xd8];
  let i = 2;
  while (i < jpeg.length) {
    if (jpeg[i] !== 0xff) throw new Error('Foto corrompida');
    while (jpeg[i + 1] === 0xff) i++; // bytes de preenchimento entre segmentos
    const marcador = jpeg[i + 1];
    if (marcador === undefined) throw new Error('Foto corrompida');

    if (marcador === SOS) {
      // Do SOS em diante são os dados da imagem: copia tudo como está.
      for (let j = i; j < jpeg.length; j++) saida.push(jpeg[j]);
      return Uint8Array.from(saida);
    }
    if (marcador === EOI || semTamanho(marcador)) {
      saida.push(0xff, marcador);
      i += 2;
      if (marcador === EOI) break;
      continue;
    }

    if (i + 4 > jpeg.length) throw new Error('Foto corrompida');
    const fim = i + 2 + ((jpeg[i + 2] << 8) | jpeg[i + 3]);
    if (fim > jpeg.length) throw new Error('Foto corrompida');
    if (!MARCADORES_REMOVIDOS.has(marcador)) {
      for (let j = i; j < fim; j++) saida.push(jpeg[j]);
    }
    i = fim;
  }
  return Uint8Array.from(saida);
}
