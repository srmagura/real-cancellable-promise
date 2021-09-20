import { CancellablePromise } from '../CancellablePromise'
import { Cancellation } from '../Cancellation'
import { buildCancellablePromise, pseudoCancellable } from '../utils'
import { defaultDuration, delay, getPromise, fail } from './__helpers__'

beforeEach(() => {
    jest.useFakeTimers()
})

describe('pseudoCancellable', () => {
    it('resolves', async () => {
        expect(await pseudoCancellable(Promise.resolve(1))).toBe(1)
    })

    it('can be canceled', async () => {
        const p = pseudoCancellable(delay(1000))
        p.cancel()

        await expect(p).rejects.toThrow(Cancellation)
    })

    test('cancel is a no-op if the promise has already resolved', async () => {
        const p = pseudoCancellable(delay(1000))
        jest.runAllTimers()

        await p
        p.cancel()
    })
})

describe('buildCancellablePromise', () => {
    it('cancels a single promise', async () => {
        jest.useRealTimers()

        const overallPromise = buildCancellablePromise(async (capture) => {
            await capture(getPromise('1'))

            await capture(getPromise('2'))
            fail('Promise 2 resolved when it should have been canceled.')
        })

        // Wait until promise1 resolves
        await delay(defaultDuration * 1.5)

        // This should cause promise2 to be canceled
        overallPromise.cancel()

        await expect(overallPromise).rejects.toThrow(Cancellation)
    })

    it('cancels multiple promises', async () => {
        const overallPromise = buildCancellablePromise(async (capture) => {
            const promise1 = capture(getPromise('1'))
            const promise2 = capture(getPromise('2'))

            try {
                await promise1
                fail('promise1 resolved.')
            } catch {
                // do nothing
            }

            try {
                await promise2
                fail('promise2 resolved.')
            } catch {
                // do nothing
            }
        })

        overallPromise.cancel()

        jest.runAllTimers()
        expect(await overallPromise).toBeUndefined()
    })

    it('rejects when the inner function rejects', async () => {
        const error = new Error()

        await expect(
            buildCancellablePromise(() => Promise.reject(error))
        ).rejects.toThrow(error)
    })

    test('capture does not handle promise rejections', async () => {
        const error = new Error()

        function callApi(): CancellablePromise<never> {
            return CancellablePromise.reject(error)
        }

        const p = buildCancellablePromise(async (capture) => {
            await capture(callApi())
        })

        await expect(p).rejects.toThrow(error)
    })
})
