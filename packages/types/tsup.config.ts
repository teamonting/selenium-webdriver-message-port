import { defineConfig } from 'tsup';

export default defineConfig([
  {
    dts: true,
    entry: {
      'selenium-webdriver': './src/selenium-webdriver/index.ts',
    },
    format: ['esm'],
    sourcemap: true,
    target: 'esnext'
  }
]);
