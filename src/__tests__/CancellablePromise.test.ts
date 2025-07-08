/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable jest/valid-expect-in-promise -- rule is bugged, see https://github.com/jest-community/eslint-plugin-jest/issues/930 */
// Jest bug: https://github.com/facebook/jest/issues/11876
import { CancellablePromise } from '../CancellablePromise';
import { Cancellation } from '../Cancellation';
import { defaultDuration, delay, getPromise, fail } from './__helpers__';

beforeEach(() => {
  jest.useFakeTimers();
});

// eslint-disable-next-line jest/expect-expect -- TypeScript test
it('is assignable to Promise', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const x: Promise<number> = getPromise(0);
});

test('toString', () => {
  expect(getPromise(1).toString()).toBe('[object CancellablePromise]');
});

describe('constructor', () => {
  it('supports canceling with a reason', async () => {
    const p = getPromise(0, { cancellationReason: 'myReason' });
    p.cancel();

    jest.runAllTimers();

    await expect(p).rejects.toThrow(new Cancellation('myReason'));
  });
});

describe('then', () => {
  it('rejects when the original promise rejects', async () => {
    const p = getPromise(5, { shouldResolve: false }).then((n) => n * 2);
    jest.runAllTimers();

    await expect(p).rejects.toThrow('myError');
  });

  it('executes a synchronous success callback', async () => {
    const p: CancellablePromise<number> = getPromise(5).then((n) => n * 2);
    jest.runAllTimers();

    expect(await p).toBe(10);
  });

  it('executes a synchronous failure callback', async () => {
    const p: CancellablePromise<number | string> = getPromise(5, {
      shouldResolve: false,
    }).then(undefined, (e) => {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('myError');

      return 'handled';
    });
    jest.runAllTimers();

    expect(await p).toBe('handled');
  });

  it('executes an asynchronous success callback', async () => {
    jest.useRealTimers();

    const p: CancellablePromise<number> = getPromise(5).then((n) =>
      getPromise(n * 2)
    );

    expect(await p).toBe(10);
  });

  it('executes an asynchronous failure callback', async () => {
    jest.useRealTimers();

    const p: CancellablePromise<number | string> = getPromise(5, {
      shouldResolve: false,
    }).then(undefined, (e) => {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('myError');

      return getPromise('handled');
    });

    expect(await p).toBe('handled');
  });

  it('cancels the original promise', async () => {
    const p = getPromise(5).then((n) => n * 2);
    p.cancel();

    await expect(p).rejects.toThrow(Cancellation);
  });

  it('cancels the asynchronous success callback', async () => {
    jest.useRealTimers();

    const p: CancellablePromise<number> = getPromise(5).then((n) =>
      getPromise(n * 2)
    );

    // Wait for first promise to resolve
    await delay(defaultDuration * 1.5);
    p.cancel();

    await expect(p).rejects.toThrow(Cancellation);
  });

  it('cancels the asynchronous failure callback', async () => {
    jest.useRealTimers();

    const p: CancellablePromise<number | string> = getPromise(5, {
      shouldResolve: false,
    }).then(undefined, (e) => {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('myError');

      return getPromise('handled');
    });

    // Wait for first promise to resolve
    await delay(defaultDuration * 1.5);
    p.cancel();

    await expect(p).rejects.toThrow(Cancellation);
  });

  it('handles then returning null', async () => {
    const p = getPromise(5).then(() => null);
    jest.runAllTimers();
    expect(await p).toBeNull();
  });

  it('handles then chaining', async () => {
    jest.useRealTimers();

    const p: CancellablePromise<number> = getPromise(5)
      .then((n) => getPromise(n * 2))
      .then((n) => getPromise(n * 2))
      .then((n) => getPromise(n * 2));

    expect(await p).toBe(40);
  });

  it('cancels all promises in a then chain', async () => {
    jest.useRealTimers();

    const p: CancellablePromise<number> = getPromise(5)
      .then((n) => getPromise(n * 2))
      .then((n) => getPromise(n * 2))
      .then((n) => getPromise(n * 2));

    // Wait for all but the last promise to resolve
    await delay(defaultDuration * 3.5);
    p.cancel();

    await expect(p).rejects.toThrow(Cancellation);
  });

  it('cancels pending promises', async () => {
    jest.useRealTimers();

    const p = CancellablePromise.resolve().then(() => getPromise(1));
    p.cancel();
    await expect(p).rejects.toThrow(Cancellation);
  });
});

describe('catch', () => {
  it('resolves', async () => {
    const p = getPromise(1).catch(fail);
    jest.runAllTimers();

    expect(await p).toBe(1);
  });

  it('handles rejection', async () => {
    /* eslint-disable jest/no-conditional-expect */
    const p = getPromise(1, { shouldResolve: false }).catch((e) => {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('myError');

      return 'handled';
    });
    /* eslint-enable jest/no-conditional-expect */

    jest.runAllTimers();

    expect(await p).toBe('handled');
  });

  it('cancels the original promise', async () => {
    const errorHandler = jest.fn();
    const p = getPromise(1, { shouldResolve: false }).catch(errorHandler);
    p.cancel();
    jest.runAllTimers();

    expect(await p).toBeUndefined();
    expect(errorHandler).toHaveBeenCalledWith(new Cancellation());
  });

  it('cancels pending promises', async () => {
    const p = CancellablePromise.reject(new Error()).catch(() => getPromise(1));
    p.cancel();
    await expect(p).rejects.toThrow(Cancellation);
  });

  it('will keep cancelling promises even if you handle the cancellation', async () => {
    jest.useRealTimers();

    const errors: unknown[] = [];
    const p = CancellablePromise.reject(new Cancellation())
      .catch((e) => {
        errors.push(e);
        return getPromise(1);
      })
      .catch((e) => {
        errors.push(e);
        return getPromise(2);
      })
      .catch((e) => {
        errors.push(e);
        return 3;
      });
    p.cancel();
    await expect(p).resolves.toBe(3);
    expect(errors).toHaveLength(3);
    const [error1, error2, error3] = errors;
    expect(error1).toBeInstanceOf(Cancellation);
    expect(error2).toBeInstanceOf(Cancellation);
    expect(error3).toBeInstanceOf(Cancellation);
  });
});

describe('resolve', () => {
  it('resolves', async () => {
    expect(await CancellablePromise.resolve(7)).toBe(7);
  });

  it('resolves undefined', async () => {
    const p: CancellablePromise<void> = CancellablePromise.resolve();
    expect(await p).toBeUndefined();
  });

  it('resolves even if canceled immediately', async () => {
    const p = CancellablePromise.resolve();
    p.cancel();

    expect(await p).toBeUndefined();
  });
});

describe('reject', () => {
  it('rejects', async () => {
    await expect(CancellablePromise.reject(new Error('test'))).rejects.toThrow(
      'test'
    );
  });

  it('rejects with undefined', async () => {
    const p: CancellablePromise<void> = CancellablePromise.reject();

    await expect(p).rejects.toBeUndefined();
  });

  it('rejects even if canceled immediately', async () => {
    const p = CancellablePromise.reject();
    p.cancel();

    await expect(p).rejects.toBeUndefined();
  });
});

describe('all', () => {
  // eslint-disable-next-line jest/expect-expect -- TypeScript test
  it('is typesafe', async () => {
    const p0: CancellablePromise<0> = getPromise<0>(0);
    const p1: CancellablePromise<1> = getPromise<1>(1);
    const p2: CancellablePromise<2> = getPromise<2>(2);
    const p3: CancellablePromise<3> = getPromise<3>(3);
    const p4: CancellablePromise<4> = getPromise<4>(4);
    const p5: CancellablePromise<5> = getPromise<5>(5);
    const p6: CancellablePromise<6> = getPromise<6>(6);
    const p7: CancellablePromise<7> = getPromise<7>(7);
    const p8: CancellablePromise<8> = getPromise<8>(8);
    const p9: CancellablePromise<9> = getPromise<9>(9);
    jest.runAllTimers();

    function range(count: number): number[] {
      const result = [];

      for (let i = 0; i < count; i++) result.push(i);

      return result;
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const y: 0[] = await CancellablePromise.all(range(20).map(() => p0));

    const x0: 0[] = await CancellablePromise.all([p0]);
    const x2: [0, 1, 2] = await CancellablePromise.all([p0, p1, p2]);
    const x3: [0, 1, 2, 3] = await CancellablePromise.all([p0, p1, p2, p3]);
    const x4: [0, 1, 2, 3, 4] = await CancellablePromise.all([
      p0,
      p1,
      p2,
      p3,
      p4,
    ]);
    const x5: [0, 1, 2, 3, 4, 5] = await CancellablePromise.all([
      p0,
      p1,
      p2,
      p3,
      p4,
      p5,
    ]);
    const x6: [0, 1, 2, 3, 4, 5, 6] = await CancellablePromise.all([
      p0,
      p1,
      p2,
      p3,
      p4,
      p5,
      p6,
    ]);
    const x7: [0, 1, 2, 3, 4, 5, 6, 7] = await CancellablePromise.all([
      p0,
      p1,
      p2,
      p3,
      p4,
      p5,
      p6,
      p7,
    ]);
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
    ]);
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
    ]);
    /* eslint-enable @typescript-eslint/no-unused-vars */
  });

  it('supports normal promises, thenables, and non-promises', async () => {
    const [r0, r1, r2] = await CancellablePromise.all([
      Promise.resolve(0),
      Promise.resolve(1) as PromiseLike<number>,
      2,
    ]);

    expect(r0).toBe(0);
    expect(r1).toBe(1);
    expect(r2).toBe(2);
  });

  it('returns the results of the input promises', async () => {
    const p0 = getPromise<0>(0);
    const p1 = getPromise<1>(1);
    jest.runAllTimers();

    expect(await CancellablePromise.all([p0, p1])).toEqual([0, 1]);
  });

  it('rejects when the first promise rejects', async () => {
    const promise = CancellablePromise.all([
      getPromise(0, { shouldResolve: false }),
      getPromise(1),
    ]);
    jest.runAllTimers();

    await expect(promise).rejects.toThrow('myError');
  });

  it('cancels all the input promises', async () => {
    const p0 = getPromise<0>(0);
    const p1 = getPromise<1>(1);

    const all = CancellablePromise.all([p0, p1]);
    all.cancel();

    await expect(all).rejects.toThrow(Cancellation);
  });
});

describe('race', () => {
  // eslint-disable-next-line jest/expect-expect -- testing no exception
  it('never resolves if no arguments given', () => {
    CancellablePromise.race([]).then(fail).catch(fail);
    jest.runAllTimers();
  });

  it('resolves', async () => {
    const p = CancellablePromise.race([
      CancellablePromise.resolve(0),
      getPromise(1),
    ]);

    expect(await p).toBe(0);
  });

  it('rejects', async () => {
    const p = CancellablePromise.race([
      CancellablePromise.reject(new Error('myError')),
      getPromise(1),
    ]);
    jest.runAllTimers();

    await expect(p).rejects.toThrow('myError');
  });

  it('cancels all promises', async () => {
    const p0 = getPromise(0).then(() => fail());
    const p1 = getPromise(1).then(() => fail());

    const race = CancellablePromise.race([p0, p1]);
    race.cancel();
    jest.runAllTimers();

    await expect(race).rejects.toThrow(Cancellation);
  });
});

describe('finally', () => {
  const cleanup = jest.fn();

  it('resolves', async () => {
    const p = getPromise(1).finally(cleanup);

    expect(cleanup).not.toHaveBeenCalled();
    jest.runAllTimers();

    expect(await p).toBe(1);
    expect(cleanup).toHaveBeenCalled();
  });

  it('rejects', async () => {
    const p = getPromise(1, { shouldResolve: false }).finally(cleanup);

    expect(cleanup).not.toHaveBeenCalled();
    jest.runAllTimers();

    await expect(p).rejects.toThrow();
    expect(cleanup).toHaveBeenCalled();
  });

  it('rejects if callback throws', async () => {
    const p = getPromise(1).finally(() => {
      throw new Error('cleanupError');
    });

    jest.runAllTimers();
    await expect(p).rejects.toThrow('cleanupError');
  });

  it('still runs the callback if the promise is canceled', async () => {
    const p = getPromise(1).finally(cleanup);
    p.cancel();

    await expect(p).rejects.toThrow(Cancellation);
    expect(cleanup).toHaveBeenCalled();
  });

  it('cannot modify the resolved value', async () => {
    const p = getPromise(1).finally(() => 2);
    jest.runAllTimers();

    expect(await p).toBe(1);
  });
});

describe('allSettled', () => {
  it('resolves', async () => {
    const p1 = CancellablePromise.resolve(1);
    const p2 = delay(defaultDuration);
    const p3 = getPromise(3, { shouldResolve: false });

    jest.runAllTimers();
    const [r1, r2, r3] = await CancellablePromise.allSettled([p1, p2, p3]);
    expect(r1).toEqual({ status: 'fulfilled', value: 1 });
    expect(r2).toEqual({ status: 'fulfilled', value: undefined });
    expect(r3).toEqual({ status: 'rejected', reason: new Error('myError') });
  });

  it('resolves and cancels all promises when canceled', async () => {
    const p1 = getPromise(1).then(() => fail());
    const p2 = delay(defaultDuration);
    const p3 = getPromise(3, { shouldResolve: false });

    const allSettled = CancellablePromise.allSettled([p1, p2, p3]);
    allSettled.cancel();

    jest.runAllTimers();

    const [r1, r2, r3] = await allSettled;
    expect(r1).toEqual({ status: 'rejected', reason: new Cancellation() });
    expect(r2).toEqual({ status: 'fulfilled', value: undefined });
    expect(r3).toEqual({ status: 'rejected', reason: new Cancellation() });
  });
});

describe('delay', () => {
  it('delays', async () => {
    let resolved = false;

    const p = CancellablePromise.delay(200).then(() => {
      resolved = true;
      return undefined;
    });

    jest.advanceTimersByTime(100);
    expect(resolved).toBe(false);

    jest.runAllTimers();
    expect(await p).toBeUndefined();
    expect(resolved).toBe(true);
  });

  it('can be canceled', async () => {
    const p = CancellablePromise.delay(200);
    p.cancel();

    await expect(p).rejects.toThrow(Cancellation);
  });

  test('cancel is a no-op if the promise has already resolved', async () => {
    const p = CancellablePromise.delay(100);
    jest.runAllTimers();

    expect(await p).toBeUndefined();
    p.cancel();
  });
});
