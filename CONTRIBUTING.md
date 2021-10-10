# Contributing to real-cancellable-promise

Contributions are welcome.

## Development

1. `yarn install`
2. `yarn setup` — setup precommit hook
3. Check for type errors: `yarn tsc`
4. Run Rollup: `yarn build`
5. Run tests: `yarn test`
6. Run ESLint: `yarn lint-all`

## Publishing

1. Make sure that the CI workflow succeeded.
2. Increment version in `package.json`.
3. (If production release) Add a git tag in the format `v1.0.0`.
4. Commit and push. Remember to push tags as well with `git push --tags`.
5. `yarn npm publish` or `yarn npm publish --tag next`. The `prepack` script will automatically do a clean and build.
6. (If production release) Create a new release in GitHub.

## TypeDoc

You can build the API documentation by running `yarn typedoc`.

## Test Projects Repository

There are some test projects that use `real-cancellable-promise` in the [real-cancellable-promise-test-projects](https://github.com/srmagura/real-cancellable-promise-test-projects) repository.
