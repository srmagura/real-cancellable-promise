import { noop } from 'lodash'

declare function setTimeout(func: () => void, delay: number): number
declare function clearTimeout(timer: number | undefined): void

/**
 * `CancellablePromise` is just a regular promise with a `cancel` method.
 *
 * Can be created from jQuery XHR objects and fetch requests.
 */
export type CancellablePromise<T> = Promise<T> & { cancel(reason?: string): void }

/**
 * If canceled, a [[`CancellablePromise`]] should throw an `Cancel` object.
 *
 * This is modeled after axios.
 */
export class Cancel {
    readonly message?: string

    constructor(message?: string) {
        this.message = message
    }
}

/**
 * Utility functions for [[`CancellablePromise`]].
 */
export abstract class CancellablePromiseUtil {
    /**
     * A typesafe way to attach a `cancel` method to a regular promise.
     *
     * The promise object is mutated.
     */
    static attachCancel<T>(
        promise: Promise<T>,
        cancel: (reason?: string) => void
    ): CancellablePromise<T> {
        const cancellablePromise = promise as CancellablePromise<T>
        cancellablePromise.cancel = cancel

        return cancellablePromise
    }

    /**
     * This method allows you to perform a synchronous operation after the promise resolves.
     * `onFulfilled` is not allowed to return a promise.
     *
     * @returns a [[`CancellablePromise`]] whose `cancel` method cancels the original
     * promise passed in to `then`.
     */
    static then<T, TResult>(
        cancellablePromise: CancellablePromise<T>,
        onFulfilled?: ((value: T) => TResult) | null,
        onRejected?: ((reason: unknown) => TResult) | null
    ): CancellablePromise<TResult> {
        return CancellablePromiseUtil.attachCancel(
            cancellablePromise.then(onFulfilled, onRejected),
            cancellablePromise.cancel
        )
    }

    /**
     * Analogous to `Promise.resolve`.
     */
    static resolve(): CancellablePromise<void>

    static resolve<T>(value: T): CancellablePromise<T>

    static resolve(value?: unknown): CancellablePromise<unknown> {
        // The returned promise should resolve even if it is canceled.
        // The idea is that the promise is resolved instantaneously, so by the time
        // the promise is canceled, it has already resolved.
        return CancellablePromiseUtil.attachCancel(Promise.resolve(value), noop)
    }

    /**
     * Analogous to `Promise.reject`.
     *
     * @param reason this should be an `Error` object
     */
    static reject<T>(reason?: unknown): CancellablePromise<T> {
        return CancellablePromiseUtil.attachCancel(Promise.reject(reason), noop)
    }

    /**
     * Analogous to `Promise.all`.
     *
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each of the
     * promises passed in to `CancellablePromiseUtil.all`.
     */
    static all<T1>(promises: [CancellablePromise<T1>]): CancellablePromise<[T1]>

    static all<T1, T2>(
        promises: [CancellablePromise<T1>, CancellablePromise<T2>]
    ): CancellablePromise<[T1, T2]>

    static all<T1, T2, T3>(
        promises: [CancellablePromise<T1>, CancellablePromise<T2>, CancellablePromise<T3>]
    ): CancellablePromise<[T1, T2, T3]>

    static all<T1, T2, T3, T4>(
        promises: [
            CancellablePromise<T1>,
            CancellablePromise<T2>,
            CancellablePromise<T3>,
            CancellablePromise<T4>
        ]
    ): CancellablePromise<[T1, T2, T3, T4]>

    static all<T1, T2, T3, T4, T5>(
        promises: [
            CancellablePromise<T1>,
            CancellablePromise<T2>,
            CancellablePromise<T3>,
            CancellablePromise<T4>,
            CancellablePromise<T5>
        ]
    ): CancellablePromise<[T1, T2, T3, T4, T5]>

    static all<T1, T2, T3, T4, T5, T6>(
        promises: [
            CancellablePromise<T1>,
            CancellablePromise<T2>,
            CancellablePromise<T3>,
            CancellablePromise<T4>,
            CancellablePromise<T5>,
            CancellablePromise<T6>
        ]
    ): CancellablePromise<[T1, T2, T3, T4, T5, T6]>

    static all<T1, T2, T3, T4, T5, T6, T7>(
        promises: [
            CancellablePromise<T1>,
            CancellablePromise<T2>,
            CancellablePromise<T3>,
            CancellablePromise<T4>,
            CancellablePromise<T5>,
            CancellablePromise<T6>,
            CancellablePromise<T7>
        ]
    ): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7]>

    static all<T1, T2, T3, T4, T5, T6, T7, T8>(
        promises: [
            CancellablePromise<T1>,
            CancellablePromise<T2>,
            CancellablePromise<T3>,
            CancellablePromise<T4>,
            CancellablePromise<T5>,
            CancellablePromise<T6>,
            CancellablePromise<T7>,
            CancellablePromise<T8>
        ]
    ): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8]>

    static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
        promises: [
            CancellablePromise<T1>,
            CancellablePromise<T2>,
            CancellablePromise<T3>,
            CancellablePromise<T4>,
            CancellablePromise<T5>,
            CancellablePromise<T6>,
            CancellablePromise<T7>,
            CancellablePromise<T8>,
            CancellablePromise<T9>
        ]
    ): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>

    static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
        promises: [
            CancellablePromise<T1>,
            CancellablePromise<T2>,
            CancellablePromise<T3>,
            CancellablePromise<T4>,
            CancellablePromise<T5>,
            CancellablePromise<T6>,
            CancellablePromise<T7>,
            CancellablePromise<T8>,
            CancellablePromise<T9>,
            CancellablePromise<T10>
        ]
    ): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>

    static all<T>(promises: CancellablePromise<T>[]): CancellablePromise<T[]>

    static all(promises: CancellablePromise<unknown>[]): CancellablePromise<unknown> {
        return CancellablePromiseUtil.attachCancel(Promise.all(promises), () =>
            promises.forEach((p) => p.cancel())
        )
    }

    /**
     * @returns a `CancellablePromise` that resolves after `ms` milliseconds.
     */
    static delay(ms: number): CancellablePromise<void> {
        let timer: number | undefined
        let rejectFn = noop

        const promise = new Promise<void>((resolve, reject) => {
            timer = setTimeout(resolve, ms)
            rejectFn = reject
        })

        return CancellablePromiseUtil.attachCancel(promise, () => {
            clearTimeout(timer)
            rejectFn(new Cancel())
        })
    }
}

/**
 * Takes in a regular `Promise` and returns a `CancellablePromise`. If canceled,
 * the `CancellablePromise` will immediately reject with `new Cancel()`, but the asynchronous
 * operation will not truly be aborted.
 */
export function pseudoCancellable<T>(promise: Promise<T>): CancellablePromise<T> {
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

    return CancellablePromiseUtil.attachCancel(promise2, () => {
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
 * Used to build a single [[`CancellablePromise`]] from a multi-step asynchronous
 * operation.
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
    innerFunc: (capture: CaptureCancellablePromise) => Promise<T>
): CancellablePromise<T> {
    const capturedPromises: CancellablePromise<unknown>[] = []

    const capture: CaptureCancellablePromise = (promise) => {
        capturedPromises.push(promise)
        return promise
    }

    function cancel(): void {
        for (const promise of capturedPromises) promise.cancel()
    }

    return CancellablePromiseUtil.attachCancel(innerFunc(capture), cancel)
}
