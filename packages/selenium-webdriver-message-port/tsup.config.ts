import { defineConfig, type Options } from 'tsup';
import overrideConfig from './tsup.config.override.ts';

const baseConfig: Options = {
  dts: true,
  sourcemap: true
};

export default defineConfig([
  overrideConfig({
    ...baseConfig,
    entry: {
      host: './src/host/index.ts',
      index: './src/index.ts'
    },
    format: ['esm'],
    target: 'esnext'
  }),
  overrideConfig({
    ...baseConfig,
    entry: {
      browser: './src/browser/index.ts',
      internal: './src/internal.ts'
    },
    format: ['esm'],
    noExternal: ['@ungap/structured-clone', 'uuid', 'valibot', 'workthru'],
    target: 'esnext'
  })
]);
