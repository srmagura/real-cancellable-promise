const noop = () => {}

/**
 * `CPromise` is just a regular promise with a `cancel` method.
 *
 * Can be created from fetch requests, axios requests, and jQuery.ajax XHR objects.
 */
export type CPromise<T> = Promise<T> & { cancel(reason?: string): void }

/**
 * Utility functions for [[`CancellablePromise`]].
 */
export abstract class CancellablePromise {
    /**
     * A typesafe way to attach a `cancel` method to a regular promise.
     *
     * The promise object is mutated.
     */
    static attachCancel<T>(
        promise: Promise<T>,
        cancel: (reason?: string) => void
    ): CPromise<T> {
        const CPromise = promise as CPromise<T>
        cancellablePromise.cancel = cancel

        return cancellablePromise
    }

    /**
     * This method allows you to perform a synchronous operation after the promise resolves.
     * `onFulfilled` is not allowed to return a promise.
     *
     * @returns a [[`CPromise`]] whose `cancel` method cancels the original
     * promise passed in to `then`.
     */
    static then<T, TResult>(
        cancellablePromise: CPromise<T>,
        onFulfilled?: ((value: T) => TResult) | null,
        onRejected?: ((reason: unknown) => TResult) | null
    ): CPromise<TResult> {
        return CPromise.attachCancel(
            cancellablePromise.then(onFulfilled, onRejected),
            cancellablePromise.cancel
        )
    }

    /**
     * Analogous to `Promise.resolve`.
     */
    static resolve(): CPromise<void>

    static resolve<T>(value: T): CPromise<T>

    static resolve(value?: unknown): CPromise<unknown> {
        // The returned promise should resolve even if it is canceled.
        // The idea is that the promise is resolved instantaneously, so by the time
        // the promise is canceled, it has already resolved.
        return CPromise.attachCancel(Promise.resolve(value), noop)
    }

    /**
     * Analogous to `Promise.reject`.
     *
     * @param reason this should be an `Error` object
     */
    static reject<T>(reason?: unknown): CPromise<T> {
        return CPromise.attachCancel(Promise.reject(reason), noop)
    }

    /**
     * Analogous to `Promise.all`.
     *
     * @returns a [[`CPromise`]], which, if canceled, will cancel each of the
     * promises passed in to `CPromiseUtil.all`.
     */
    static all<T1>(promises: [CPromise<T1>]): CPromise<[T1]>

    static all<T1, T2>(promises: [CPromise<T1>, CPromise<T2>]): CPromise<[T1, T2]>

    static all<T1, T2, T3>(
        promises: [CPromise<T1>, CPromise<T2>, CPromise<T3>]
    ): CPromise<[T1, T2, T3]>

    static all<T1, T2, T3, T4>(
        promises: [CPromise<T1>, CPromise<T2>, CPromise<T3>, CPromise<T4>]
    ): CPromise<[T1, T2, T3, T4]>

    static all<T1, T2, T3, T4, T5>(
        promises: [CPromise<T1>, CPromise<T2>, CPromise<T3>, CPromise<T4>, CPromise<T5>]
    ): CPromise<[T1, T2, T3, T4, T5]>

    static all<T1, T2, T3, T4, T5, T6>(
        promises: [
            CPromise<T1>,
            CPromise<T2>,
            CPromise<T3>,
            CPromise<T4>,
            CPromise<T5>,
            CPromise<T6>
        ]
    ): CPromise<[T1, T2, T3, T4, T5, T6]>

    static all<T1, T2, T3, T4, T5, T6, T7>(
        promises: [
            CPromise<T1>,
            CPromise<T2>,
            CPromise<T3>,
            CPromise<T4>,
            CPromise<T5>,
            CPromise<T6>,
            CPromise<T7>
        ]
    ): CPromise<[T1, T2, T3, T4, T5, T6, T7]>

    static all<T1, T2, T3, T4, T5, T6, T7, T8>(
        promises: [
            CPromise<T1>,
            CPromise<T2>,
            CPromise<T3>,
            CPromise<T4>,
            CPromise<T5>,
            CPromise<T6>,
            CPromise<T7>,
            CPromise<T8>
        ]
    ): CPromise<[T1, T2, T3, T4, T5, T6, T7, T8]>

    static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
        promises: [
            CPromise<T1>,
            CPromise<T2>,
            CPromise<T3>,
            CPromise<T4>,
            CPromise<T5>,
            CPromise<T6>,
            CPromise<T7>,
            CPromise<T8>,
            CPromise<T9>
        ]
    ): CPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>

    static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
        promises: [
            CPromise<T1>,
            CPromise<T2>,
            CPromise<T3>,
            CPromise<T4>,
            CPromise<T5>,
            CPromise<T6>,
            CPromise<T7>,
            CPromise<T8>,
            CPromise<T9>,
            CPromise<T10>
        ]
    ): CPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>

    static all<T>(promises: CPromise<T>[]): CPromise<T[]>

    static all(promises: CPromise<unknown>[]): CPromise<unknown> {
        return CPromise.attachCancel(Promise.all(promises), () =>
            promises.forEach((p) => p.cancel())
        )
    }

    /**
     * @returns a `CPromise` that resolves after `ms` milliseconds.
     */
    static delay(ms: number): CPromise<void> {
        let timer: number | undefined
        let rejectFn = noop

        const promise = new Promise<void>((resolve, reject) => {
            timer = setTimeout(resolve, ms)
            rejectFn = reject
        })

        return CPromise.attachCancel(promise, () => {
            clearTimeout(timer)
            rejectFn(new Cancel())
        })
    }
}

/**
 * Takes in a regular `Promise` and returns a `CPromise`. If canceled,
 * the `CPromise` will immediately reject with `new Cancel()`, but the asynchronous
 * operation will not truly be aborted.
 */
export function pseudoCancellable<T>(promise: Promise<T>): CPromise<T> {
    let canceled = false
    let rejectFn = noop

    const promise2 = new Promise<T>((resolve, reject) => {
        rejectFn = reject

        promise
            .then((result) => {
                if (!canceled) resolve(result)
                return undefined
            })
            .catch((e: unknown) => {
                if (!canceled) reject(e)
            })
    })

    return CPromise.attachCancel(promise2, () => {
        canceled = true
        rejectFn(new Cancel())
    })
}

/**
 * Used by [[`useCancellablePromiseCleanup`]] and [[`buildCancellablePromise`]].
 */
export type CaptureCancellablePromise = <T>(
    promise: CancellablePromise<T>
) => CancellablePromise<T>

/**
 * Used to build a single [[`CPromise`]] from a multi-step asynchronous
 * operation.
 *
 * ```
 * function query(id: number): CPromise<QueryResult> {
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
    innerFunc: (capture: CaptureCancellablePromise) => Promise<T>
): CPromise<T> {
    const capturedPromises: CPromise<unknown>[] = []

    const capture: CaptureCancellablePromise = (promise) => {
        capturedPromises.push(promise)
        return promise
    }

    function cancel(): void {
        for (const promise of capturedPromises) promise.cancel()
    }

    return CancellablePromise.attachCancel(innerFunc(capture), cancel)
}
