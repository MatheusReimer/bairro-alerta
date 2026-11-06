import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import type { ProvedorLocalizacao } from '../servicos/localizacao';

/** Lado maior da foto: suficiente para ver o problema e, em JPEG 60%, bem abaixo do limite de 700 KB. */
const LADO_MAXIMO = 1024;

export type OrigemFoto = 'camera' | 'galeria';

export class ErroCamera extends Error {}

/** Abre a câmera ou a galeria e devolve a URI de um JPEG já reduzido, ou null se o morador cancelar. */
export async function obterFoto(origem: OrigemFoto): Promise<string | null> {
  if (origem === 'camera') {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      throw new ErroCamera('Permita o uso da câmera nas configurações do celular ou escolha uma foto da galeria.');
    }
  }
  const opcoes: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, exif: false };
  const resultado =
    origem === 'camera' ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
  const foto = resultado.assets?.[0];
  if (resultado.canceled || !foto) return null;

  const maior = Math.max(foto.width, foto.height);
  const contexto = ImageManipulator.manipulate(foto.uri);
  if (maior > LADO_MAXIMO) {
    contexto.resize(foto.width >= foto.height ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO });
  }
  const imagem = await contexto.renderAsync();
  const salva = await imagem.saveAsync({ format: SaveFormat.JPEG, compress: 0.6 });
  return salva.uri;
}

/** Lê os bytes da foto para envio (o serviço remove os metadados antes de subir). */
export async function lerFoto(uri: string): Promise<Uint8Array> {
  const resposta = await fetch(uri);
  return new Uint8Array(await resposta.arrayBuffer());
}

export const localizacaoExpo: ProvedorLocalizacao = {
  async pedirPermissao() {
    return (await Location.requestForegroundPermissionsAsync()).granted;
  },
  async posicaoAtual() {
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: coords.latitude, longitude: coords.longitude };
  },
};
