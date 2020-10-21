import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';
import { Cacheable } from '../../cacheable/cacheable.annotation';

let CacheableA: any;
describe('Given a @Memo method that returns an Array', () => {
    let joinpoint: jasmine.Spy;
    let memoMethod: () => unknown[];
    beforeEach(() => {
        setupMemoAspect();
        joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => {
            const a = new CacheableA() as any;
            a.someProp = 'someProp';
            return [a, a];
        });
        memoMethod = createMemoMethod((...args: any[]) => joinpoint(...args) as unknown[]);

        localStorage.clear();
    });

    describe('of Cacheables', () => {
        beforeEach(() => {
            setupMemoAspect();
            @Cacheable()
            class _CacheableA {}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            CacheableA = _CacheableA;

            joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => {
                const a = new CacheableA() as any;
                a.someProp = 'someProp';
                return [a, a];
            });
            memoMethod();
        });
        it('should return an array of objects of correct type', () => {
            const r = memoMethod();
            expect(memoMethod()).toEqual(r);
            expect(joinpoint).toHaveBeenCalledTimes(1);
            expect(memoMethod()).toEqual(jasmine.any(Array));
            expect(memoMethod()[0]).toEqual(jasmine.any(CacheableA));
        });
    });

    describe('of dates', () => {
        beforeEach(() => {
            joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => [new Date(10000), new Date(20000)]);
        });

        it('should return an array of correct type', () => {
            expect(memoMethod()).toEqual(memoMethod());
            expect(joinpoint).toHaveBeenCalledTimes(1);
            expect(memoMethod()).toEqual(jasmine.any(Array));
            expect(memoMethod()[0]).toEqual(jasmine.any(Date));
        });
    });

    describe('of arrays', () => {
        beforeEach(() => {
            joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => [
                ['a', 'b'],
                ['c', 'd'],
            ]);
        });

        it('should return an array of correct type', () => {
            expect(memoMethod()).toEqual(memoMethod());
            expect(joinpoint).toHaveBeenCalledTimes(1);
            expect(memoMethod()).toEqual(jasmine.any(Array));
            expect(memoMethod()[0]).toEqual(jasmine.any(Array));
        });
    });

    describe('with cyclic elements', () => {
        let result: any;
        beforeEach(() => {
            joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => {
                const arr1 = [] as any[];
                const arr2 = [] as any[];
                arr1.push('1', arr1, arr2);
                arr2.push('2', arr1);

                return (result = arr1);
            });
        });

        it('should return an array of correct type', () => {
            expect(memoMethod()).toEqual(result);
            expect(memoMethod()).toEqual(result);
            expect(joinpoint).toHaveBeenCalledTimes(1);
        });
    });

    describe('of promises', () => {
        beforeEach(() => {
            joinpoint = jasmine
                .createSpy('methodSpy')
                .and.callFake((...args: any[]) => [Promise.resolve('a'), Promise.resolve('b')]);
        });

        describe('when all the promises are resolved', () => {
            it('should return an array of promise with correct resolved value', async () => {
                const res1 = memoMethod();
                expect(res1).toEqual(jasmine.any(Array));
                expect(res1[0]).toEqual(jasmine.any(Promise));
                expect([await res1[0], await res1[1]]).toEqual(['a', 'b']);

                const res2 = memoMethod();

                expect(res2).toEqual(jasmine.any(Array));
                expect(res2[0]).toEqual(jasmine.any(Promise));
            });

            it('should use cached data and call the real method once', async () => {
                const res1 = memoMethod();
                expect(res1).toEqual(jasmine.any(Array));
                expect(res1[0]).toEqual(jasmine.any(Promise));
                await Promise.all(res1);

                const res2 = memoMethod();
                expect(joinpoint).toHaveBeenCalledTimes(1);
                expect([await res2[0], await res2[1]]).toEqual(['a', 'b']);

                return new Promise<any>((resolve) => {
                    setTimeout(async () => {
                        const res2 = memoMethod();
                        expect(joinpoint).toHaveBeenCalledTimes(1);
                        expect([await res2[0], await res2[1]]).toEqual(['a', 'b']);

                        resolve();
                    }, 0);
                });
            });
        });

        describe('when not all the promises are resolved', () => {
            it('should return an array of promise', async () => {
                const res1 = memoMethod();
                expect(res1).toEqual(jasmine.any(Array));
                expect(res1[0]).toEqual(jasmine.any(Promise));
                await res1[0];

                const res2 = memoMethod();
                expect(res2).toEqual(jasmine.any(Array));
                expect([await res1[0], await res1[1]]).toEqual(['a', 'b']);
                expect([await res2[0], await res2[1]]).toEqual(['a', 'b']);
            });

            it('should call real method once', async () => {
                const res1 = memoMethod();
                expect(res1).toEqual(jasmine.any(Array));
                expect(res1[0]).toEqual(jasmine.any(Promise));
                await res1[0];
                memoMethod();

                expect(joinpoint).toHaveBeenCalledTimes(1);
            });
        });
    });
});
