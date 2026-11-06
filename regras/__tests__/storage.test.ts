import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

let env: RulesTestEnvironment;
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const tipo = (contentType: string) => ({ contentType });

const storage = (uid?: string) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).storage();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-bairro-alerta',
    storage: { rules: readFileSync(join(__dirname, '..', '..', 'storage.rules'), 'utf8') },
  });
});

afterAll(() => env.cleanup());

describe('fotos no Storage (T-SEG-03)', () => {
  it('morador envia foto JPEG na própria pasta', async () => {
    await assertSucceeds(uploadBytes(ref(storage('maria'), 'fotos/maria/1.jpg'), jpeg, tipo('image/jpeg')));
  });

  it('não envia na pasta de outra pessoa', async () => {
    await assertFails(uploadBytes(ref(storage('maria'), 'fotos/joao/1.jpg'), jpeg, tipo('image/jpeg')));
  });

  it('não envia arquivo que não é imagem', async () => {
    await assertFails(uploadBytes(ref(storage('maria'), 'fotos/maria/x.jpg'), jpeg, tipo('application/pdf')));
  });

  it('não envia imagem acima de 5 MB', async () => {
    const grande = new Uint8Array(5 * 1024 * 1024 + 1);
    await assertFails(uploadBytes(ref(storage('maria'), 'fotos/maria/g.jpg'), grande, tipo('image/jpeg')));
  });

  it('não sobrescreve foto já enviada', async () => {
    await uploadBytes(ref(storage('maria'), 'fotos/maria/2.jpg'), jpeg, tipo('image/jpeg'));
    await assertFails(uploadBytes(ref(storage('maria'), 'fotos/maria/2.jpg'), jpeg, tipo('image/jpeg')));
  });

  it('visitante sem login não vê fotos; morador logado vê', async () => {
    await uploadBytes(ref(storage('maria'), 'fotos/maria/3.jpg'), jpeg, tipo('image/jpeg'));
    await assertFails(getBytes(ref(storage(), 'fotos/maria/3.jpg')));
    await assertSucceeds(getBytes(ref(storage('joao'), 'fotos/maria/3.jpg')));
  });
});
