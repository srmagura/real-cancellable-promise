## 1.2.0

### Chores

- Update the signature of `CancellablePromise.race` to match that of `Promise.race` in the latest version of TypeScript. This should not be a breaking change for the vast majority of users. (#8)

## 1.1.2

### Bug Fixes

- Make the `capture` function of `buildCancellablePromise` an identity function
  from a type perspective.

## 1.1.1

### Bug Fixes

- Fix `CancellablePromise<T>` not being assignable to `Promise<T>`

## 1.1.0

### Features

- Publish ES module

## 1.0.0

Initial release
