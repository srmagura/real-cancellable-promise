import { CancellablePromise } from './CancellablePromise';
import { Cancellation } from './Cancellation';
import { noop } from './noop';

/**
 * Takes in a regular `Promise` and returns a `CancellablePromise`. If canceled,
 * the `CancellablePromise` will immediately reject with a `Cancellation`, but the asynchronous
 * operation will not truly be aborted.
 *
 * Analogous to
 * [make-cancellable-promise](https://www.npmjs.com/package/make-cancellable-promise).
 */
export function pseudoCancellable<T>(
  promise: PromiseLike<T>
): CancellablePromise<T> {
  let canceled = false;
  let rejectFn: (reason?: unknown) => void = noop;

  const newPromise = new Promise<T>((resolve, reject) => {
    rejectFn = reject;

    // eslint-disable-next-line promise/catch-or-return -- no catch method on PromiseLike
    promise.then(
      (result) => {
        if (!canceled) {
          resolve(result);
          rejectFn = noop;
        }

        return undefined;
      },
      (e: unknown) => {
        if (!canceled) reject(e);
      }
    );
  });

  function cancel(): void {
    canceled = true;
    rejectFn(new Cancellation());
  }

  return new CancellablePromise(newPromise, cancel);
}

/**
 * The type of the `capture` function used in [[`buildCancellablePromise`]].
 */
export type CaptureCancellablePromise = <P extends CancellablePromise<unknown>>(
  promise: P
) => P;

/**
 * Used to build a single [[`CancellablePromise`]] from a multi-step asynchronous
 * flow.
 *
 * When the overall promise is canceled, each captured promise is canceled. In practice,
 * this means the active asynchronous operation is canceled.
 *
 * ```
 * function query(id: number): CancellablePromise<QueryResult> {
 *     return buildCancellablePromise(async capture => {
 *         const result1 = await capture(api.method1(id))
 *
 *         // do some stuff
 *
 *         const result2 = await capture(api.method2(result1.id))
 *
 *         return { result1, result2 }
 *     })
 * }
 * ```
 *
 * @param innerFunc an async function that takes in a `capture` function and returns
 * a regular `Promise`
 */
export function buildCancellablePromise<T>(
  innerFunc: (capture: CaptureCancellablePromise) => PromiseLike<T>
): CancellablePromise<T> {
  const capturedPromises = new Set<CancellablePromise<unknown>>();

  const capture: CaptureCancellablePromise = (promise) => {
    capturedPromises.add(promise);
    promise.finally(() => capturedPromises.delete(promise)).catch(() => {});
    return promise;
  };

  function cancel(): void {
    capturedPromises.forEach((p) => p.cancel());
  }

  return new CancellablePromise(innerFunc(capture), cancel);
}
