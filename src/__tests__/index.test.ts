import { noop, range } from 'lodash'
import {
    buildCancellablePromise,
    Cancel,
    CancellablePromise,
    CancellablePromise,
    pseudoCancellable,
} from '../CancellablePromise'

beforeEach(() => {
    jest.useFakeTimers()
})

interface Options {
    resolve: boolean
}

function getPromise<T>(
    returnValue: T,
    duration: number,
    options: Options = { resolve: true }
): CancellablePromise<T> {
    let timer: NodeJS.Timeout | undefined
    let rejectFn: (error?: unknown) => void = noop

    const promise = new Promise<T>((resolve, reject) => {
        rejectFn = reject

        timer = setTimeout(() => {
            if (options.resolve) {
                resolve(returnValue)
            } else {
                reject(new Error('Promise rejected for reason XYZ.'))
            }
        }, duration)
    })

    const cancel = (): void => {
        if (timer) clearTimeout(timer)
        rejectFn(new Cancel())
    }

    return CancellablePromise.attachCancel(promise, cancel)
}

describe('CancellablePromiseUtil', () => {
    describe('attachCancel', () => {
        it('resolves', async () => {
            const p = getPromise('5', 500)
            jest.runAllTimers()

            expect(await p).toBe('5')
        })

        it('rejects', async () => {
            const p = getPromise('5', 500, { resolve: false })
            jest.runAllTimers()

            await expect(p).rejects.toThrow()
        })

        it('cancels', async () => {
            const p = getPromise('5', 500)
            p.cancel()

            await expect(p).rejects.toBeInstanceOf(Cancel)
        })
    })

    describe('then', () => {
        it('transforms the result of the original promise', async () => {
            const p: CancellablePromise<number> = CancellablePromise.then(
                getPromise('5', 500),
                (s) => parseInt(s) * 2
            )
            jest.runAllTimers()

            expect(await p).toBe(10)
        })

        it('rejects when the original promise rejects', async () => {
            const p = CancellablePromise.then(
                getPromise('5', 500, { resolve: false }),
                (s) => parseInt(s) * 2
            )
            jest.runAllTimers()

            await expect(p).rejects.toThrow()
        })

        it('cancels the original promise when cancel is called', async () => {
            const p = CancellablePromise.then(
                getPromise('5', 500),
                (s) => parseInt(s) * 2
            )
            p.cancel()

            await expect(p).rejects.toBeInstanceOf(Cancel)
        })
    })

    describe('all', () => {
        it('is typesafe', async () => {
            const p0: CancellablePromise<0> = getPromise<0>(0, 0)
            const p1: CancellablePromise<1> = getPromise<1>(1, 0)
            const p2: CancellablePromise<2> = getPromise<2>(2, 0)
            const p3: CancellablePromise<3> = getPromise<3>(3, 0)
            const p4: CancellablePromise<4> = getPromise<4>(4, 0)
            const p5: CancellablePromise<5> = getPromise<5>(5, 0)
            const p6: CancellablePromise<6> = getPromise<6>(6, 0)
            const p7: CancellablePromise<7> = getPromise<7>(7, 0)
            const p8: CancellablePromise<8> = getPromise<8>(8, 0)
            const p9: CancellablePromise<9> = getPromise<9>(9, 0)
            jest.runAllTimers()

            /* eslint-disable @typescript-eslint/no-unused-vars */
            const y: 0[] = await CancellablePromise.all(range(20).map(() => p0))

            const x0: [0] = await CancellablePromise.all([p0])
            const x2: [0, 1, 2] = await CancellablePromise.all([p0, p1, p2])
            const x3: [0, 1, 2, 3] = await CancellablePromise.all([p0, p1, p2, p3])
            const x4: [0, 1, 2, 3, 4] = await CancellablePromise.all([p0, p1, p2, p3, p4])
            const x5: [0, 1, 2, 3, 4, 5] = await CancellablePromise.all([
                p0,
                p1,
                p2,
                p3,
                p4,
                p5,
            ])
            const x6: [0, 1, 2, 3, 4, 5, 6] = await CancellablePromise.all([
                p0,
                p1,
                p2,
                p3,
                p4,
                p5,
                p6,
            ])
            const x7: [0, 1, 2, 3, 4, 5, 6, 7] = await CancellablePromise.all([
                p0,
                p1,
                p2,
                p3,
                p4,
                p5,
                p6,
                p7,
            ])
            const x8: [0, 1, 2, 3, 4, 5, 6, 7, 8] = await CancellablePromise.all([
                p0,
                p1,
                p2,
                p3,
                p4,
                p5,
                p6,
                p7,
                p8,
            ])
            const x9: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] = await CancellablePromise.all([
                p0,
                p1,
                p2,
                p3,
                p4,
                p5,
                p6,
                p7,
                p8,
                p9,
            ])
            /* eslint-enable @typescript-eslint/no-unused-vars */
        })

        it('returns the results of the input promises', async () => {
            const p0: CancellablePromise<0> = getPromise<0>(0, 500)
            const p1: CancellablePromise<1> = getPromise<1>(1, 1000)
            jest.runAllTimers()

            expect(await CancellablePromise.all([p0, p1])).toEqual([0, 1])
        })

        it('rejects when the first promise rejects', async () => {
            const promise = CancellablePromise.all([
                getPromise(0, 500, { resolve: false }),
                getPromise(1, 1000),
            ])
            jest.advanceTimersByTime(600)

            await expect(promise).rejects.toThrow()
        })
    })

    describe('resolve', () => {
        it('resolves', async () => {
            expect(await CancellablePromise.resolve(7)).toBe(7)
        })

        it('resolves undefined', async () => {
            const p: CancellablePromise<void> = CancellablePromise.resolve()
            expect(await p).toBeUndefined()
        })

        it('resolves even if canceled immediately', async () => {
            const p = CancellablePromise.resolve()
            p.cancel()

            expect(await p).toBeUndefined()
        })
    })

    describe('reject', () => {
        it('rejects', async () => {
            await expect(CancellablePromise.reject(new Error('test'))).rejects.toThrow(
                'test'
            )
        })

        it('rejects with undefined', async () => {
            const p: CancellablePromise<void> = CancellablePromise.reject()

            await expect(p).rejects.toBeUndefined()
        })

        it('rejects even if canceled immediately', async () => {
            const p = CancellablePromise.reject()
            p.cancel()

            await expect(p).rejects.toBeUndefined()
        })
    })

    describe('delay', () => {
        it('delays', async () => {
            let resolved = false

            const p = CancellablePromise.delay(200).then(() => {
                resolved = true
                return undefined
            })

            jest.advanceTimersByTime(100)
            expect(resolved).toBe(false)

            jest.runAllTimers()
            await p
            expect(resolved).toBe(true)
        })

        it('can be canceled', async () => {
            const p = CancellablePromise.delay(200)
            p.cancel()

            await expect(p).rejects.toBeInstanceOf(Cancel)
        })
    })
})

describe('pseudoCancellable', () => {
    it('resolves', async () => {
        expect(await pseudoCancellable(Promise.resolve(1))).toBe(1)
    })

    it('can be canceled', async () => {
        const p = pseudoCancellable(new Promise((resolve) => setTimeout(resolve, 1000)))
        p.cancel()

        await expect(p).rejects.toBeInstanceOf(Cancel)
    })
})

describe('buildCancellablePromise', () => {
    it('cancels a single promise', async () => {
        //jest.useRealTimers()

        const overallPromise = buildCancellablePromise(async (capture) => {
            await capture(getPromise('1', 100))

            await capture(getPromise('2', 400))
            fail('Promise 2 resolved when it should have been canceled.')
        })

        // Wait until promise1 resolves
        //await CancellablePromiseUtil.delay(200)
        jest.advanceTimersByTime(200)

        // This should cause promise2 to be canceled
        overallPromise.cancel()

        jest.runAllTimers()
        await expect(overallPromise).rejects.toBeInstanceOf(Cancel)
    })

    it('cancels multiple promises', async () => {
        const overallPromise = buildCancellablePromise(async (capture) => {
            const promise1 = capture(getPromise('1', 100))
            const promise2 = capture(getPromise('2', 100))

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
