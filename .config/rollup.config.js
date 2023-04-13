import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.mjs',
      format: 'es',
    },
    {
      dir: 'dist',
      format: 'cjs',
    },
  ],
  plugins: [typescript({ exclude: '**/__tests__/**/*' })],
};
