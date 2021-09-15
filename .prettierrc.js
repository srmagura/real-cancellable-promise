module.exports = {
    semi: false,
    singleQuote: true,
    tabWidth: 4,
    printWidth: 90,
    overrides: [
        {
            files: '*.y?(a)ml',
            options: {
                tabWidth: 2,
            },
        },
    ],
}
