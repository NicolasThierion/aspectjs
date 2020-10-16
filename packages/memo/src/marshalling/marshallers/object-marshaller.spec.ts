import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';

describe('Given a @Memo method', () => {
    let joinpoint: jasmine.Spy;
    let memoMethod: () => any;
    beforeEach(() => {
        setupMemoAspect();
        localStorage.clear();
        joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => {});
        memoMethod = createMemoMethod((...args: any[]) => joinpoint(args));
    });

    describe('that returns an Object', () => {
        describe('with Date attributes', () => {
            beforeEach(() => {
                joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => ({ date: new Date() }));
            });

            it('should return an object of correct type', () => {
                const res1 = memoMethod();
                const res2 = memoMethod();
                expect(joinpoint).toHaveBeenCalledTimes(1);
                expect(res2.date).toEqual(jasmine.any(Date));
                expect(res1).toEqual(res2);
            });
        });

        describe('with Promise attributes', () => {
            beforeEach(() => {
                joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => ({
                    promiseA: Promise.resolve('a'),
                    promiseB: Promise.resolve('b'),
                }));
            });

            it('should return an object with promise attributes of correct values', async () => {
                const res1 = memoMethod();
                expect([await res1.promiseA, await res1.promiseB]).toEqual(['a', 'b']);

                const res2 = memoMethod();
                expect([await res2.promiseA, await res2.promiseB]).toEqual(['a', 'b']);
            });

            it('should use cached values and call the real method once', async () => {
                const res1 = memoMethod();
                const res2 = memoMethod();
                expect([await res1.promiseA, await res1.promiseB]).toEqual(['a', 'b']);
                expect([await res2.promiseA, await res2.promiseB]).toEqual(['a', 'b']);
                expect(joinpoint).toHaveBeenCalledTimes(1);
            });
        });

        describe('with cyclic references', () => {
            let result: any;
            beforeEach(() => {
                joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => {
                    const a = {} as any;
                    const b = {} as any;
                    a.a = b.a = a;
                    a.b = b.b = b;
                    return (result = a);
                });
            });

            it('should return an object with attributes of correct type', () => {
                expect(memoMethod()).toEqual(result);
                expect(memoMethod()).toEqual(result);
                expect(joinpoint).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('that returns null', () => {
        beforeEach(() => {
            joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => null);
        });
        it('should return null', () => {
            expect(memoMethod()).toEqual(memoMethod());
            expect(joinpoint).toHaveBeenCalledTimes(1);
            expect(memoMethod()).toEqual(null);
        });
    });
});
