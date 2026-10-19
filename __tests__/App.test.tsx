import { render, screen } from '@testing-library/react-native';

import App from '../App';

describe('App', () => {
  it('mostra o nome do aplicativo como título', async () => {
    await render(<App />);

    expect(screen.getByRole('header', { name: 'Bairro Alerta' })).toBeOnTheScreen();
  });

  it('explica para que serve o aplicativo', async () => {
    await render(<App />);

    expect(screen.getByText('Registre e acompanhe os problemas do seu bairro.')).toBeOnTheScreen();
  });
});
