module.exports = {
    extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:promise/recommended',
        'prettier',
    ],
    plugins: ['promise'],
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        'import/prefer-default-export': 'off',
        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    },
}
