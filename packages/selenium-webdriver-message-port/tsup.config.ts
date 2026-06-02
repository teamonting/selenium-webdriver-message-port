import { defineConfig, type Options } from 'tsup';
import overrideConfig from './tsup.config.override.ts';

const baseConfig: Options = {
  dts: true,
  entry: {
    browser: './src/browser/index.ts',
    host: './src/host/index.ts',
    index: './src/index.ts'
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
