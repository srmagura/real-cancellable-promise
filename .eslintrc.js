module.exports = {
    extends: ['airbnb-base', 'airbnb-typescript/base', 'prettier'],
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        'import/prefer-default-export': 'off',
    },
}
