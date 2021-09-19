import { CancellablePromise } from '../../CancellablePromise'
import { Cancellation } from '../../Cancellation'

export function fail(reason: string = 'fail was called in a test.'): never {
    throw new Error(reason)
}

export function delay(duration: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, duration))
}

interface Options {
    shouldResolve: boolean
    duration: number
    cancellationReason: string
}

export const defaultDuration = 100

export function getPromise<T>(
    returnValue: T,
    options?: Partial<Options>
): CancellablePromise<T> {
    const shouldResolve = options?.shouldResolve ?? true
    const duration = options?.duration ?? defaultDuration
    const cancellationReason = options?.cancellationReason

    let timer: NodeJS.Timeout | undefined
    let rejectFn: (error?: unknown) => void = () => {}

    const promise = new Promise<T>((resolve, reject) => {
        rejectFn = reject

        timer = setTimeout(() => {
            if (shouldResolve) {
                resolve(returnValue)
            } else {
                reject(new Error('myError'))
            }
        }, duration)
    })

    function cancel(): void {
        if (timer) clearTimeout(timer)
        rejectFn(new Cancellation(cancellationReason))
    }

    return new CancellablePromise(promise, cancel)
}
