// /**
//  * Takes in a regular `Promise` and returns a `CancellablePromise`. If canceled,
//  * the `CancellablePromise` will immediately reject with `new Cancel()`, but the asynchronous
//  * operation will not truly be aborted.
//  */
// export function pseudoCancellable<T>(promise: Promise<T>): CancellablePromise<T> {
//     let canceled = false
//     let rejectFn = noop

//     const promise2 = new Promise<T>((resolve, reject) => {
//         rejectFn = reject

//         promise
//             .then((result) => {
//                 if (!canceled) resolve(result)
//                 return undefined
//             })
//             .catch((e: unknown) => {
//                 if (!canceled) reject(e)
//             })
//     })

//     return CancellablePromise.attachCancel(promise2, () => {
//         canceled = true
//         rejectFn(new Cancel())
//     })
// }

// /**
//  * Used by [[`useCancellablePromiseCleanup`]] and [[`buildCancellablePromise`]].
//  */
// export type CaptureCancellablePromise = <T>(
//     promise: CancellablePromise<T>
// ) => CancellablePromise<T>

// /**
//  * Used to build a single [[`CancellablePromise`]] from a multi-step asynchronous
//  * operation.
//  *
//  * ```
//  * function query(id: number): CancellablePromise<QueryResult> {
//  *     return buildCancellablePromise(async capture => {
//  *         const result1 = await capture(api.method1(id))
//  *
//  *         // do some stuff
//  *
//  *         const result2 = await capture(api.method2(result1.id))
//  *
//  *         return { result1, result2 }
//  *     })
//  * }
//  * ```
//  *
//  * @param innerFunc an async function that takes in a `capture` function and returns
//  * a regular `Promise`
//  */
// export function buildCancellablePromise<T>(
//     innerFunc: (capture: CaptureCancellablePromise) => Promise<T>
// ): CancellablePromise<T> {
//     const capturedPromises: CancellablePromise<unknown>[] = []

//     const capture: CaptureCancellablePromise = (promise) => {
//         capturedPromises.push(promise)
//         return promise
//     }

//     function cancel(): void {
//         for (const promise of capturedPromises) promise.cancel()
//     }

//     return CancellablePromise.attachCancel(innerFunc(capture), cancel)
// }
