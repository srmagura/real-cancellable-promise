import typescript from '@rollup/plugin-typescript'

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.cjs',
            format: 'cjs',
        },
        {
            dir: 'dist',
            format: 'es',
        },
    ],
    plugins: [typescript({ exclude: '**/__tests__/**/*' })],
}
