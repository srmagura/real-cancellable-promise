import { Cancellation } from './Cancellation';
import { noop } from './noop';

/**
 * The most abstract thing we can cancel — a thenable with a cancel method.
 */
export type PromiseWithCancel<T> = PromiseLike<T> & { cancel(): void };

/**
 * Determines if an arbitrary value is a thenable with a cancel method.
 */
export function isPromiseWithCancel<T>(
  value: unknown
): value is PromiseWithCancel<T> {
  return (
    // typeof null === "object"
    value != null &&
    typeof value === 'object' &&
    typeof (value as { then?: unknown }).then === 'function' &&
    typeof (value as { cancel?: unknown }).cancel === 'function'
  );
}

/**
 * A promise with a `cancel` method.
 *
 * If canceled, the `CancellablePromise` will reject with a [[`Cancellation`]]
 * object.
 *
 * @typeParam T what the `CancellablePromise` resolves to
 */
export class CancellablePromise<T> {
  /**
   * As a consumer of the library, you shouldn't ever need to access
   * `CancellablePromise.promise` directly.
   *
   * If you are subclassing `CancellablePromise` for some reason, you
   * can access this property.
   */
  protected readonly promise: Promise<T>;

  // IMPORTANT: When defining a new `cancel` function,
  // e.g. in the implementation of `then`,
  // always use an arrow function so that `this` is bound.

  /**
   * Cancel the `CancellablePromise`.
   */
  readonly cancel: (reason?: string) => void;

  /**
   * @param promise a normal promise or thenable
   * @param cancel a function that cancels `promise`. **Calling `cancel` after
   * `promise` has resolved must be a no-op.**
   */
  constructor(promise: PromiseLike<T>, cancel: (reason?: string) => void) {
    this.promise = Promise.resolve(promise);
    this.cancel = cancel;
  }

  /**
   * Analogous to `Promise.then`.
   *
   * `onFulfilled` on `onRejected` can return a value, a normal promise, or a
   * `CancellablePromise`. So you can make a chain a `CancellablePromise`s
   * like this:
   *
   * ```
   * const overallPromise = cancellableAsyncFunction1()
   *     .then(cancellableAsyncFunction2)
   *     .then(cancellableAsyncFunction3)
   *     .then(cancellableAsyncFunction4)
   * ```
   *
   * Then if you call `overallPromise.cancel`, `cancel` is called on all
   * `CancellablePromise`s in the chain! In practice, this means that
   * whichever async operation is in progress will be canceled.
   *
   * @returns a new CancellablePromise
   */
  then<TResult1 = T, TResult2 = never>(
    onFulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onRejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>) // eslint-disable-line @typescript-eslint/no-explicit-any -- to match the types used for Promise in the official lib.d.ts
      | undefined
      | null
  ): CancellablePromise<TResult1 | TResult2> {
    let fulfill;
    let reject;
    let callbackPromiseWithCancel: PromiseWithCancel<unknown> | undefined;
    let canceled = false;

    if (onFulfilled) {
      fulfill = (value: T): TResult1 | PromiseLike<TResult1> => {
        const nextValue: TResult1 | PromiseLike<TResult1> = onFulfilled(value);

        if (isPromiseWithCancel(nextValue)) {
          callbackPromiseWithCancel = nextValue;
          if (canceled) {
            // so we don't throw away the original result, only cancel the resulting promise
            nextValue.cancel();
          }
        }

        return nextValue;
      };
    }

    if (onRejected) {
      reject = (reason: unknown): TResult2 | PromiseLike<TResult2> => {
        const nextValue: TResult2 | PromiseLike<TResult2> = onRejected(reason);

        if (isPromiseWithCancel(nextValue)) {
          callbackPromiseWithCancel = nextValue;
          if (canceled) {
            // so we don't throw away the original error, only cancel the resulting promise
            nextValue.cancel();
          }
        }

        return nextValue;
      };
    }

    const newPromise = this.promise.then(fulfill, reject);

    const newCancel = () => {
      this.cancel();
      canceled = true;
      callbackPromiseWithCancel?.cancel();
    };

    return new CancellablePromise(newPromise, newCancel);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any -- to match the types used for Promise in the official lib.d.ts */
  /**
   * Analogous to `Promise.catch`.
   */
  catch<TResult = never>(
    onRejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): CancellablePromise<T | TResult> {
    return this.then(undefined, onRejected);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  /**
   * Attaches a callback that is invoked when the Promise is settled
   * (fulfilled or rejected). The resolved value cannot be modified from the
   * callback.
   * @param onFinally The callback to execute when the Promise is settled
   * (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally(onFinally?: (() => void) | undefined | null): CancellablePromise<T> {
    return new CancellablePromise(this.promise.finally(onFinally), this.cancel);
  }

  /**
   * This is necessary to make `CancellablePromise` assignable to `Promise`.
   */
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag](): string {
    return 'CancellablePromise';
  }

  /**
   * Analogous to `Promise.resolve`.
   *
   * The returned promise should resolve even if it is canceled. The idea is
   * that the promise is resolved instantaneously, so by the time the promise
   * is canceled, it has already resolved.
   */
  static resolve(): CancellablePromise<void>;

  static resolve<T>(value: T): CancellablePromise<T>;

  static resolve(value?: unknown): CancellablePromise<unknown> {
    return new CancellablePromise(Promise.resolve(value), noop);
  }

  /**
   * Analogous to `Promise.reject`.
   *
   * Like `CancellablePromise.resolve`, canceling the returned
   * `CancellablePromise` is a no-op.
   *
   * @param reason this should probably be an `Error` object
   */
  static reject<T>(reason?: unknown): CancellablePromise<T> {
    return new CancellablePromise(Promise.reject(reason), noop);
  }

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    values: readonly [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>,
      T7 | PromiseLike<T7>,
      T8 | PromiseLike<T8>,
      T9 | PromiseLike<T9>,
      T10 | PromiseLike<T10>
    ]
  ): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    values: readonly [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>,
      T7 | PromiseLike<T7>,
      T8 | PromiseLike<T8>,
      T9 | PromiseLike<T9>
    ]
  ): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2, T3, T4, T5, T6, T7, T8>(
    values: readonly [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>,
      T7 | PromiseLike<T7>,
      T8 | PromiseLike<T8>
    ]
  ): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2, T3, T4, T5, T6, T7>(
    values: readonly [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>,
      T7 | PromiseLike<T7>
    ]
  ): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2, T3, T4, T5, T6>(
    values: readonly [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>
    ]
  ): CancellablePromise<[T1, T2, T3, T4, T5, T6]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2, T3, T4, T5>(
    values: readonly [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>
    ]
  ): CancellablePromise<[T1, T2, T3, T4, T5]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2, T3, T4>(
    values: readonly [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>
    ]
  ): CancellablePromise<[T1, T2, T3, T4]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2, T3>(
    values: readonly [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>
    ]
  ): CancellablePromise<[T1, T2, T3]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T1, T2>(
    values: readonly [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]
  ): CancellablePromise<[T1, T2]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all<T>(
    values: readonly (T | PromiseLike<T>)[]
  ): CancellablePromise<T[]>;

  /**
   * Analogous to `Promise.all`.
   *
   * @param values an array that may contain `CancellablePromise`s, promises,
   * thenables, and resolved values
   * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
   * of the promises passed in to `CancellablePromise.all`.
   */
  static all(values: readonly unknown[]): CancellablePromise<unknown> {
    return new CancellablePromise(Promise.all(values), () => {
      for (const value of values) {
        if (isPromiseWithCancel(value)) value.cancel();
      }
    });
  }

  /**
   * Creates a `CancellablePromise` that is resolved with an array of results
   * when all of the provided `Promises` resolve or reject.
   * @param values An array of `Promises`.
   * @returns A new `CancellablePromise`.
   */
  static allSettled<T extends readonly unknown[] | readonly [unknown]>(
    values: T
  ): CancellablePromise<{
    -readonly [P in keyof T]: PromiseSettledResult<
      T[P] extends PromiseLike<infer U> ? U : T[P]
    >;
  }>;

  /**
   * Creates a `CancellablePromise` that is resolved with an array of results
   * when all of the provided `Promise`s resolve or reject.
   *
   * @param values An array of `Promise`s.
   * @returns A new `CancellablePromise`. Canceling it cancels all of the input
   * promises.
   */
  static allSettled<T>(
    values: Iterable<T>
  ): CancellablePromise<
    PromiseSettledResult<T extends PromiseLike<infer U> ? U : T>[]
  >;

  static allSettled(values: unknown[]): CancellablePromise<unknown> {
    const cancel = (): void => {
      for (const value of values) {
        if (isPromiseWithCancel(value)) {
          value.cancel();
        }
      }
    };

    return new CancellablePromise(Promise.allSettled(values), cancel);
  }

  /**
   * Creates a `CancellablePromise` that is resolved or rejected when any of
   * the provided `Promises` are resolved or rejected.
   * @param values An array of `Promises`.
   * @returns A new `CancellablePromise`. Canceling it cancels all of the input
   * promises.
   */
  static race<T extends readonly unknown[] | []>(
    values: T
  ): CancellablePromise<Awaited<T[number]>> {
    const cancel = (): void => {
      for (const value of values) {
        if (isPromiseWithCancel(value)) {
          value.cancel();
        }
      }
    };

    return new CancellablePromise(Promise.race(values), cancel);
  }

  // Promise.any is an ES2021 feature. Not yet implemented.
  // /**
  //  * The any function returns a `CancellablePromise` that is fulfilled by the
  //  * first given promise to be fulfilled, or rejected with an `AggregateError`
  //  * containing an array of rejection reasons if all of the given promises are
  //  * rejected. It resolves all elements of the passed iterable to promises as
  //  * it runs this algorithm.
  //  * @param values An array or iterable of Promises.
  //  * @returns A new `CancellablePromise`.
  //  */
  // any<T>(values: (T | PromiseLike<T>)[] | Iterable<T | PromiseLike<T>>): CancellablePromise<T> {
  //     return new CancellablePromise(Promise.any(values), cancel))
  // }

  /**
   * @returns a `CancellablePromise` that resolves after `ms` milliseconds.
   */
  static delay(ms: number): CancellablePromise<void> {
    let timer: NodeJS.Timer | undefined;
    let rejectFn: (reason?: unknown) => void = noop;

    const promise = new Promise<void>((resolve, reject) => {
      timer = setTimeout(() => {
        resolve();
        rejectFn = noop;
      }, ms);
      rejectFn = reject;
    });

    return new CancellablePromise(promise, () => {
      if (timer) clearTimeout(timer);
      rejectFn(new Cancellation());
    });
  }
}
