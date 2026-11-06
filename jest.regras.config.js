// Testes das regras de segurança. Rodam no Firebase Emulator via `npm run test:regras`.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/regras'],
  transform: { '^.+\.ts$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
  testTimeout: 20000,
};
