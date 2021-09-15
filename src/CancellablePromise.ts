import { Cancellation } from './Cancellation'
import { noop } from './Internal'

/**
 * The most abstract thing we can cancel — a thenable with a cancel method.
 */
export type PromiseWithCancel<T> = PromiseLike<T> & { cancel(): void }

function isPromiseWithCancel<T>(value: unknown): value is PromiseWithCancel<T> {
    return (
        typeof value === 'object' &&
        typeof (value as any).then === 'function' &&
        typeof (value as any).cancel === 'function'
    )
}

/**
 * A promise with a `cancel` method.
 *
 * If canceled, the `CancellablePromise` will reject with a [[`Cancellation`]] object.
 */
export class CancellablePromise<T> {
    readonly promise: Promise<T>

    readonly cancel: (reason?: string) => void

    /**
     * @param promise a normal promise or thenable
     * @param cancel a function that cancels `promise`. **Calling `cancel` after `promise`
     * has resolved must be a no-op.**
     */
    constructor(promise: PromiseLike<T>, cancel: (reason?: string) => void) {
        this.promise = Promise.resolve(promise)
        this.cancel = cancel
    }

    /**
     * Analogous to `Promise.then`.
     *
     * `onFulfilled` on `onRejected` can return a value, a normal promise, or a
     * `CancellablePromise`. So you can make a chain a `CancellablePromise`s like this:
     *
     * ```
     * const overallPromise = cancellableAsyncFunction1()
     *     .then(cancellableAsyncFunction2)
     *     .then(cancellableAsyncFunction3)
     *     .then(cancellableAsyncFunction4)
     * ```
     *
     * Then if you call `overallPromise.cancel`, `cancel` is called on all
     * `CancellablePromise`s in the chain! In practice, this means that whichever async
     * operation is in progress will be canceled.
     *
     * @returns a new CancellablePromise
     */
    then<TResult1 = T, TResult2 = never>(
        onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onRejected?:
            | ((reason: any) => TResult2 | PromiseLike<TResult2>)
            | undefined
            | null
    ): CancellablePromise<TResult1 | TResult2> {
        let fulfill
        let reject
        let callbackPromiseWithCancel: PromiseWithCancel<unknown> | undefined

        if (onFulfilled) {
            fulfill = (value: T): TResult1 | PromiseLike<TResult1> => {
                const nextValue: TResult1 | PromiseLike<TResult1> = onFulfilled(value)

                if (isPromiseWithCancel(nextValue)) callbackPromiseWithCancel = nextValue

                return nextValue
            }
        }

        if (onRejected) {
            reject = (reason: any): TResult2 | PromiseLike<TResult2> => {
                const nextValue: TResult2 | PromiseLike<TResult2> = onRejected(reason)

                if (isPromiseWithCancel(nextValue)) callbackPromiseWithCancel = nextValue

                return nextValue
            }
        }

        const newPromise = this.promise.then(fulfill, reject)

        const newCancel = () => {
            this.cancel()
            callbackPromiseWithCancel?.cancel()
        }

        return new CancellablePromise(newPromise, newCancel)
    }

    /**
     * Analogous to `Promise.resolve`.
     *
     * The returned promise should resolve even if it is canceled.
     * The idea is that the promise is resolved instantaneously, so by the time
     * the promise is canceled, it has already resolved.
     */
    static resolve(): CancellablePromise<void>

    static resolve<T>(value: T): CancellablePromise<T>

    static resolve(value?: unknown): CancellablePromise<unknown> {
        return new CancellablePromise(Promise.resolve(value), noop)
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
        return new CancellablePromise(Promise.reject(reason), noop)
    }

    /**
     * Analogous to `Promise.all`.
     *
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each of the
     * promises passed in to `CancellablePromise.all`.
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
        return new CancellablePromise(Promise.all(promises), () =>
            promises.forEach((p) => p.cancel())
        )
    }

    /**
     * @returns a `CancellablePromise` that resolves after `ms` milliseconds.
     */
    static delay(ms: number): CancellablePromise<void> {
        let timer: NodeJS.Timer | undefined
        let rejectFn: (reason?: any) => void = noop

        const promise = new Promise<void>((resolve, reject) => {
            timer = setTimeout(resolve, ms)
            rejectFn = reject
        })

        return new CancellablePromise(promise, () => {
            if (timer) clearTimeout(timer)
            rejectFn(new Cancellation())
        })
    }
}