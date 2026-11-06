import { defineConfig, devices } from '@playwright/test';

// Testes ponta a ponta no build web, com Firebase Emulator. Rode com `npm run e2e`.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // os cenários compartilham o mesmo emulador
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'e2e-relatorio', open: 'never' }]],
  use: {
    ...devices['Pixel 7'],
    // Local: Chrome já instalado (headless). CI: Chromium do Playwright.
    channel: process.env.CI ? undefined : 'chrome',
    baseURL: 'http://127.0.0.1:8099',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Praça do bairro Vila Nova, Blumenau.
    geolocation: { latitude: -26.9055, longitude: -49.0943 },
    permissions: ['geolocation'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/servir-web.mjs',
    url: 'http://127.0.0.1:8099',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
