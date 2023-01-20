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

        expect(await p).toBeUndefined()
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

describe('buildCancellablePromise capture', () => {
    it('passes through the argument type', async () => {
        jest.useRealTimers()
        // this is a "compile-time" test
        // it will only be tested when compiled with TypeScript (`$ yarn tsc`)
        const promise = buildCancellablePromise(async (capture) => {
            // we build two promises that we enhance with some additional fields
            const fancyPromise1 = Object.assign( getPromise('1'), { reportProgress: () => 0.9 } )
            const fancyPromise2 = Object.assign( getPromise('2'), { info: "some enhanced promise" } )
            const capturedFancyPromise1 = capture(fancyPromise1)
            const capturedFancyPromise2 = capture(fancyPromise2)
            // these will throw a compile time error if `capture` is not an identity function (from type perspective):
            // the field `reportProgress` should be accessible on the type that passes through the `caputure` function
            expect(capturedFancyPromise1.reportProgress()).toBe(0.9)
            // the `info` field should be accessible even if the promise is passed through the `capture` function
            expect(capturedFancyPromise2.info).toBe("some enhanced promise")

            return [await capturedFancyPromise1, await capturedFancyPromise2]
        })
        const [res1, res2] = await promise
        expect(res1).toBe("1")
        expect(res2).toBe("2")
    })
})
