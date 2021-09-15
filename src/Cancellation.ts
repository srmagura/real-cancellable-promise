/**
 * If canceled, a [[`CancellablePromise`]] should throw an `Cancellation` object.
 */
export class Cancellation extends Error {
    constructor(message: string = 'Promise canceled.') {
        super(message)
    }
}
