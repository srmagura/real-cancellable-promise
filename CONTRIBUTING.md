# Contributing to real-cancellable-promise

Contributions are welcome.

## Development

1. `yarn install`
2. Check for type errors: `yarn tsc`
3. Run tests: `yarn test`
4. Run ESLint: `yarn lint-all`

## Publishing

1. Increment version in `package.json`.
2. (If production release) Add a git tag in the format `v1.0.0`.
3. Commit and push.
4. `yarn npm publish` or `yarn npm publish --tag next`. The `prepublish` script will automatically do a clean and build.
5. (If production release) Create a new release in GitHub.

## TypeDoc

You can build the API documentation by running `yarn typedoc`.

## Test Projects Repository

There are some test projects that use `real-cancellable-promise` in the [real-cancellable-promise-test-projects](https://github.com/srmagura/real-cancellable-promise-test-projects) repository.
