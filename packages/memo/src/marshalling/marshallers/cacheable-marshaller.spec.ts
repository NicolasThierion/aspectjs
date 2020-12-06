import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';
import { Cacheable } from '../../cacheable/cacheable.annotation';

let CacheableA: any;
let CacheableB: any;

describe('@Memo() on a method', () => {
    let joinpoint: jasmine.Spy;
    let memoMethod: () => any;
    beforeEach(() => {
        setupMemoAspect();
        @Cacheable()
        class _CacheableA {}
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        CacheableA = _CacheableA;
        @Cacheable()
        class _CacheableB {}
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        CacheableB = _CacheableB;
        localStorage.clear();

        joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => undefined);
        memoMethod = createMemoMethod((...args: any[]) => joinpoint(args));
    });
    describe('that returns a @Cacheable() instance', () => {
        beforeEach(() => {
            joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => new CacheableA());
        });

        it('should return an instance of the correct type', () => {
            expect(memoMethod()).toEqual(memoMethod());
            expect(joinpoint).toHaveBeenCalledTimes(1);
        });
        describe('that itself own a clas-instance property', () => {
            describe('annotated with @Cacheable', () => {
                beforeEach(() => {
                    joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => {
                        const a = new CacheableA();
                        a.b = new CacheableB();
                        return a;
                    });
                });
                it('should return an object with attributes of correct types', () => {
                    expect(memoMethod()).toEqual(memoMethod());
                    expect(memoMethod().b).toEqual(jasmine.any(CacheableB));
                    expect(joinpoint).toHaveBeenCalledTimes(1);
                });
            });

            describe('not annotated with @Cacheable', () => {
                beforeEach(() => {
                    joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => {
                        const a = new CacheableA();
                        a.x = new (class X {})();
                        return a;
                    });
                });

                it('should throw an error', () => {
                    expect(() => memoMethod()).toThrow(
                        new TypeError(
                            `Type "X" is not annotated with "@Cacheable". Please add "@Cacheable" on class "X", or register a proper MemoMarshaller for this type.`,
                        ),
                    );
                });
            });
        });

        describe('that contains Date attributes', () => {
            beforeEach(() => {
                joinpoint = jasmine.createSpy('process').and.callFake(() => {
                    const a = new CacheableA();
                    a.date = new Date();
                    return a;
                });
            });

            it('should return an object with attributes of correct types', () => {
                expect(memoMethod()).toEqual(memoMethod());
                expect(joinpoint).toHaveBeenCalledTimes(1);
                expect(memoMethod().date).toEqual(jasmine.any(Date));
            });
        });

        describe('that specifies a version', () => {
            let CachedClass: any;
            let version: () => string;
            beforeEach(() => {
                @Cacheable({
                    version: () => version(),
                })
                class _CachedClass {}
                CachedClass = _CachedClass;
            });
            beforeEach(() => {
                joinpoint = jasmine.createSpy('process').and.callFake(() => new CachedClass());
            });
            describe('that differs from the cached one', () => {
                beforeEach(() => {
                    version = jasmine.createSpy('version').and.callFake(() => `${Math.random()}`);
                });
                it('should invalidate cache', () => {
                    expect(memoMethod()).toEqual(memoMethod());
                    expect(joinpoint).toHaveBeenCalledTimes(2);
                });
            });

            xdescribe('with semver format', () => {
                describe('and the version satisfies the previous one', () => {
                    xit('should not invalidate the cache', () => {
                        version = jasmine.createSpy('version').and.callFake(() => '1.2.3');
                        const res1 = memoMethod();
                        version = jasmine.createSpy('version').and.callFake(() => '1.5.0');
                        const res2 = memoMethod();

                        expect(res1).toEqual(res2);
                        expect(joinpoint).toHaveBeenCalledTimes(1);
                    });
                });

                describe('and the version does not satisfy the previous one', () => {
                    xit('should invalidate the cache', () => {
                        version = jasmine.createSpy('version').and.callFake(() => '1.2.3');
                        const res1 = memoMethod();
                        version = jasmine.createSpy('version').and.callFake(() => '2.0.0');
                        const res2 = memoMethod();

                        expect(res1).toEqual(res2);
                        expect(joinpoint).toHaveBeenCalledTimes(2);
                    });
                });
            });
        });

        describe('and the @Cacheable hash mismatch', () => {
            beforeEach(() => {
                @Cacheable({
                    version: 1,
                })
                class CachedClass {}
                joinpoint = jasmine.createSpy('process').and.callFake(() => new CachedClass());
                expect(joinpoint).toHaveBeenCalledTimes(0);
                memoMethod();
                expect(joinpoint).toHaveBeenCalledTimes(1);
                CachedClass.toString = () => 'class CachedClass { /* new implementation */}';
            });
            it('should not invalidate the cache', () => {
                memoMethod();
                expect(joinpoint).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('that do not specify a version', () => {
        describe('and the @Cacheable hash mismatch', () => {
            beforeEach(() => {
                @Cacheable()
                class CachedClass {}
                joinpoint = jasmine.createSpy('process').and.callFake(() => new CachedClass());
                expect(joinpoint).toHaveBeenCalledTimes(0);
                memoMethod();
                expect(joinpoint).toHaveBeenCalledTimes(1);
                CachedClass.toString = () => 'class CachedClass { /* new implementation */}';
            });
            it('should invalidate the cache', () => {
                memoMethod();
                expect(joinpoint).toHaveBeenCalledTimes(2);
            });
        });
    });
    describe('not annotated with @Cacheable', () => {
        beforeEach(() => {
            joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => new (class X {})());
        });
        it('should throw an error', () => {
            expect(() => memoMethod()).toThrow(
                new TypeError(
                    `Type "X" is not annotated with "@Cacheable". Please add "@Cacheable" on class "X", or register a proper MemoMarshaller for this type.`,
                ),
            );
        });
    });
});
