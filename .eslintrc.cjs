module.exports = {
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:promise/recommended',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  plugins: ['promise', 'jest'],
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['*.cjs', 'dist/', 'docs/'],
  rules: {
    'import/prefer-default-export': 'off',

    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-restricted-syntax': [
      'error',
      // Options from https://github.com/airbnb/javascript/blob/651280e5a22d08170187bea9a2b1697832c87ebc/packages/eslint-config-airbnb-base/rules/style.js
      // with for-of removed
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
  },
};
