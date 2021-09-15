// Jest bug: https://github.com/facebook/jest/issues/11876
// Jest bug 2: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/55803
import { CancellablePromise } from '../CancellablePromise'
import { Cancellation } from '../Cancellation'
import { defaultDuration, delay, getPromise, fail } from './__helpers__'

beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()
})

describe('then', () => {
    it('rejects when the original promise rejects', async () => {
        const p = getPromise(5, { shouldResolve: false }).then((n) => n * 2)
        jest.runAllTimers()

        await expect(p).rejects.toThrow('myError')
    })

    it('executes a synchronous success callback', async () => {
        const p: CancellablePromise<number> = getPromise(5).then((n) => n * 2)
        jest.runAllTimers()

        expect(await p).toBe(10)
    })

    it('executes a synchronous failure callback', async () => {
        const p: CancellablePromise<number | string> = getPromise(5, {
            shouldResolve: false,
        }).then(undefined, (e) => {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBe('myError')

            return 'handled'
        })
        jest.runAllTimers()

        expect(await p).toBe('handled')
    })

    it('executes an asynchronous success callback', async () => {
        jest.useRealTimers()

        const p: CancellablePromise<number> = getPromise(5).then((n) => getPromise(n * 2))

        expect(await p).toBe(10)
    })

    it('executes an asynchronous failure callback', async () => {
        jest.useRealTimers()

        const p: CancellablePromise<number | string> = getPromise(5, {
            shouldResolve: false,
        }).then(undefined, (e) => {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBe('myError')

            return getPromise('handled')
        })

        expect(await p).toBe('handled')
    })

    it('cancels the original promise', async () => {
        const p = getPromise(5).then((n) => n * 2)
        p.cancel()

        await expect(p).rejects.toThrow(Cancellation)
    })

    it('cancels the asynchronous success callback', async () => {
        jest.useRealTimers()

        const p: CancellablePromise<number> = getPromise(5).then((n) => getPromise(n * 2))

        // Wait for first promise to resolve
        await delay(defaultDuration * 1.5)
        p.cancel()

        await expect(p).rejects.toThrow(Cancellation)
    })

    it('cancels the asynchronous failure callback', async () => {
        jest.useRealTimers()

        const p: CancellablePromise<number | string> = getPromise(5, {
            shouldResolve: false,
        }).then(undefined, (e) => {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBe('myError')

            return getPromise('handled')
        })

        // Wait for first promise to resolve
        await delay(defaultDuration * 1.5)
        p.cancel()

        await expect(p).rejects.toThrow(Cancellation)
    })

    it('handles then chaining', async () => {
        jest.useRealTimers()

        const p: CancellablePromise<number> = getPromise(5)
            .then((n) => getPromise(n * 2))
            .then((n) => getPromise(n * 2))
            .then((n) => getPromise(n * 2))

        expect(await p).toBe(40)
    })

    it('cancels all promises in a then chain', async () => {
        jest.useRealTimers()

        const p: CancellablePromise<number> = getPromise(5)
            .then((n) => getPromise(n * 2))
            .then((n) => getPromise(n * 2))
            .then((n) => getPromise(n * 2))

        // Wait for all but the last promise to resolve
        await delay(defaultDuration * 3.5)
        p.cancel()

        await expect(p).rejects.toThrow(Cancellation)
    })
})

describe('catch', () => {
    it('resolves', async () => {
        const p = getPromise(1).catch(fail)
        jest.runAllTimers()

        expect(await p).toBe(1)
    })

    it('handles rejection', async () => {
        const p = getPromise(1, { shouldResolve: false }).catch((e) => {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBe('myError')

            return 'handled'
        })
        jest.runAllTimers()

        expect(await p).toBe('handled')
    })

    it('cancels the original promise', async () => {
        const errorHandler = jest.fn()
        const p = getPromise(1, { shouldResolve: false }).catch(errorHandler)
        p.cancel()
        jest.runAllTimers()

        expect(await p).toBeUndefined()
        expect(errorHandler).toHaveBeenCalledWith(new Cancellation())
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
        await expect(CancellablePromise.reject(new Error('test'))).rejects.toThrow('test')
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

describe('all', () => {
    it('is typesafe', async () => {
        const p0: CancellablePromise<0> = getPromise<0>(0)
        const p1: CancellablePromise<1> = getPromise<1>(1)
        const p2: CancellablePromise<2> = getPromise<2>(2)
        const p3: CancellablePromise<3> = getPromise<3>(3)
        const p4: CancellablePromise<4> = getPromise<4>(4)
        const p5: CancellablePromise<5> = getPromise<5>(5)
        const p6: CancellablePromise<6> = getPromise<6>(6)
        const p7: CancellablePromise<7> = getPromise<7>(7)
        const p8: CancellablePromise<8> = getPromise<8>(8)
        const p9: CancellablePromise<9> = getPromise<9>(9)
        jest.runAllTimers()

        function range(count: number): number[] {
            const result = []

            for (let i = 0; i < count; i++) result.push(i)

            return result
        }

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
        const p0 = getPromise<0>(0)
        const p1 = getPromise<1>(1)
        jest.runAllTimers()

        expect(await CancellablePromise.all([p0, p1])).toEqual([0, 1])
    })

    it('rejects when the first promise rejects', async () => {
        const promise = CancellablePromise.all([
            getPromise(0, { shouldResolve: false }),
            getPromise(1),
        ])
        jest.runAllTimers()

        await expect(promise).rejects.toThrow('myError')
    })

    it('cancels all the input promises', async () => {
        const p0 = getPromise<0>(0)
        const p1 = getPromise<1>(1)

        const all = CancellablePromise.all([p0, p1])
        all.cancel()

        await expect(all).rejects.toThrow(Cancellation)
    })
})

describe('race', () => {
    it('never resolves if no arguments given', async () => {
        CancellablePromise.race([]).then(fail).catch(fail)
        jest.runAllTimers()
    })

    it('resolves', async () => {
        const p = CancellablePromise.race([CancellablePromise.resolve(0), getPromise(1)])

        expect(await p).toBe(0)
    })

    it('rejects', async () => {
        const p = CancellablePromise.race([
            CancellablePromise.reject(new Error('myError')),
            getPromise(1),
        ])
        jest.runAllTimers()

        await expect(p).rejects.toThrow('myError')
    })

    it('cancels all promises', async () => {
        const p0 = getPromise(0).then(fail)
        const p1 = getPromise(1).then(fail)

        const race = CancellablePromise.race([p0, p1])
        race.cancel()
        jest.runAllTimers()

        await expect(race).rejects.toThrow(Cancellation)
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
        expect(await p).toBeUndefined()
        expect(resolved).toBe(true)
    })

    it('can be canceled', async () => {
        const p = CancellablePromise.delay(200)
        p.cancel()

        await expect(p).rejects.toThrow(Cancellation)
    })
})
