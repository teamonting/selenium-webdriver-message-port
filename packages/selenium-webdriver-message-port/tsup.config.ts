import { defineConfig, type Options } from 'tsup';
import overrideConfig from './tsup.config.override.ts';

const baseConfig: Options = {
  dts: true,
  entry: {
    'selenium-webdriver-message-port': './src/index.ts',
    'selenium-webdriver-message-port.browser': './src/browser/index.ts',
    'selenium-webdriver-message-port.host': './src/host/index.ts'
  },
  sourcemap: true
};

export default defineConfig([
  overrideConfig({
    ...baseConfig,
    format: ['esm'],
    noExternal: ['uuid', 'workthru'],
    target: 'esnext'
  })
]);
