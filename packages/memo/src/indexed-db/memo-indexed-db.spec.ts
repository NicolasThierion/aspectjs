import { Memo } from '../memo.annotation';
import { createLocalStorage } from 'localstorage-ponyfill';
import { LsMemo, LsMemoAspect } from './memo-localstorage';
import { LoadTimeWeaver, setWeaver } from '@aspectjs/core';
import moment from 'moment';
import { DefaultCacheableAspect } from '../cacheable-aspect';
import { Cacheable } from '../cacheable.annotation';
import { LzMemoHandler } from './lz-memo-handler';

interface Runner {
    process(...args: any[]): any;
}

let CacheableA: any;
let CacheableB: any;
function _setupLsMemoAspect(ls: Storage): void {
    setWeaver(
        new LoadTimeWeaver().enable(
            new LsMemoAspect({
                localStorage: ls,
                handler: new LzMemoHandler(),
            }),
            new DefaultCacheableAspect(),
        ),
    );
}

describe('@Memo with LocalStorage aspect', () => {
    let r: Runner;
    let process: Runner['process'];
    let ns: string;
    let ls: typeof localStorage;
    let expiration: Date | number;

    const defaultArgs = ['a', 'b', 'c', 'd'];

    beforeEach(() => {
        ns = undefined;

        ls = createLocalStorage();
        ls.clear();
        _setupLsMemoAspect(ls);

        @Cacheable()
        // eslint-disable-next-line @typescript-eslint/class-name-casing
        class _CacheableA {}
        CacheableA = _CacheableA;
        @Cacheable()
        // eslint-disable-next-line @typescript-eslint/class-name-casing
        class _CacheableB {}
        CacheableB = _CacheableB;

        class RunnerImpl implements Runner {
            @LsMemo({
                namespace: () => ns,
                expiration: () => expiration,
            })
            process(...args: any[]): any {
                return process(...args);
            }
        }

        r = new RunnerImpl();
        process = jasmine
            .createSpy('process', function _process(...args: any[]) {
                return args.reverse();
            })
            .and.callThrough();
    });

    describe('when the method is called once', () => {
        it('should call the method', () => {
            const res = r.process(...defaultArgs);
            expect(process).toHaveBeenCalled();
            expect(res).toEqual(defaultArgs.reverse());
            expect(process).toHaveBeenCalledTimes(1);
        });
    });
    describe('when the method is called twice', () => {
        describe('with the same parameters', () => {
            it('should not invoke the method twice', () => {
                let res = r.process(...defaultArgs);
                expect(process).toHaveBeenCalled();
                res = r.process(...defaultArgs);
                expect(res).toEqual(defaultArgs.reverse());
                expect(process).toHaveBeenCalledTimes(1);
            });
        });

        describe('with different parameters', () => {
            it('should invoke the method twice', () => {
                let res = r.process('a', 'b');
                expect(process).toHaveBeenCalled();
                res = r.process(...defaultArgs);
                expect(res).toEqual(defaultArgs.reverse());
                expect(process).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('after the context gets reloaded', () => {
        beforeEach(() => {
            r.process(...defaultArgs);

            _setupLsMemoAspect(ls);
        });

        it('should use data cached from previous context', () => {
            const res = r.process(...defaultArgs);
            expect(res).toEqual(defaultArgs.reverse());
            expect(process).toHaveBeenCalledTimes(1);
        });
    });

    describe('with configured "namespace"', () => {
        it('should not conflict with values from other namespaces', () => {
            ns = 'ns1';
            let res = r.process(...defaultArgs);
            expect(process).toHaveBeenCalled();
            ns = 'ns2';
            res = r.process(...defaultArgs);
            expect(res).toEqual(defaultArgs.reverse());
            expect(process).toHaveBeenCalledTimes(2);
        });
    });

    describe('with configured "expiration"', () => {
        const initDate = new Date();
        beforeEach(() => {
            jasmine.clock().install();
            jasmine.clock().mockDate(initDate);
        });
        afterEach(() => {
            jasmine.clock().uninstall();
        });

        function testShouldRemoveData(cb: Function): void {
            let res = r.process(...defaultArgs);
            expect(process).toHaveBeenCalled();
            setTimeout(() => {
                res = r.process(...defaultArgs);
                expect(res).toEqual(defaultArgs.reverse());
                expect(process).toHaveBeenCalledTimes(2);
                cb();
            }, 1000 * 60 * 3);
            jasmine.clock().tick(1000 * 60 * 3 + 1);
        }

        function testShouldUseCachedData(cb: Function): void {
            let res = r.process(...defaultArgs);
            expect(process).toHaveBeenCalled();
            setTimeout(() => {
                res = r.process(...defaultArgs);
                expect(res).toEqual(defaultArgs.reverse());
                expect(process).toHaveBeenCalledTimes(1);
                cb();
            }, 1000 * 60);
            jasmine.clock().tick(1000 * 60 + 1);
        }

        describe('as a date', () => {
            beforeEach(() => {
                expiration = moment(initDate)
                    .add(2, 'm')
                    .toDate();
            });

            describe('when data did not expire', () => {
                it('should use cached data', testShouldUseCachedData);
            });

            describe('when data did expire', () => {
                it('should remove cached data', testShouldRemoveData);

                describe('after the context has been reloaded', () => {
                    beforeEach(() => {
                        r.process(...defaultArgs);

                        _setupLsMemoAspect(ls);
                    });

                    it('should remove cached data', testShouldRemoveData);
                });
            });
        });

        describe('as a number', () => {
            beforeEach(() => {
                expiration = 2 * 60;
            });
            describe('when data did not expire', () => {
                it('should use cached data', testShouldUseCachedData);
            });

            describe('when data did expire', () => {
                it('should remove cached data', testShouldRemoveData);

                describe('after the context has been reloaded', () => {
                    beforeEach(() => {
                        r.process(...defaultArgs);

                        _setupLsMemoAspect(ls);
                    });

                    it('should remove cached data', testShouldRemoveData);
                });
            });
        });
    });

    describe('when the method gets called on two different instances', () => {
        let r1: Runner;
        let r2: Runner;

        describe('and @Memo does not specify id', () => {
            describe('and object has no id or id attribute', () => {
                beforeEach(() => {
                    class RunnerImpl implements Runner {
                        @Memo({})
                        process(...args: any[]): any {
                            return process(...args);
                        }
                    }

                    r1 = new RunnerImpl();
                    r2 = new RunnerImpl();
                });
                it('should not use cache from each other', () => {
                    expect(process).not.toHaveBeenCalled();
                    r1.process(...defaultArgs);
                    expect(process).toHaveBeenCalledTimes(1);
                    r2.process(...defaultArgs);
                    expect(process).toHaveBeenCalledTimes(2);
                });
            });

            function testShouldNotUseSharedCache(): void {
                expect(process).not.toHaveBeenCalled();
                r1.process(...defaultArgs);
                expect(process).toHaveBeenCalledTimes(1);
                r1.process(...defaultArgs);
                expect(process).toHaveBeenCalledTimes(1);
                r2.process(...defaultArgs);
                expect(process).toHaveBeenCalledTimes(2);
                r2.process(...defaultArgs);
                expect(process).toHaveBeenCalledTimes(2);
            }

            describe('and object has id or id attribute', () => {
                function init(): void {
                    _setupLsMemoAspect(ls);

                    class RunnerImpl implements Runner {
                        constructor(private id: string) {}
                        @Memo({})
                        process(...args: any[]): any {
                            return process(...args);
                        }
                    }

                    r1 = new RunnerImpl('1');
                    r2 = new RunnerImpl('2');
                }
                beforeEach(init);

                it('should not use cache from each other', testShouldNotUseSharedCache);

                describe('after the context gets reloaded', () => {
                    beforeEach(() => {
                        r1.process(...defaultArgs);
                        r2.process(...defaultArgs);
                        init();
                    });
                    it('should not use cache from each other', () => {
                        expect(process).toHaveBeenCalledTimes(2);
                        r1.process(...defaultArgs);
                        expect(process).toHaveBeenCalledTimes(2);
                        r2.process(...defaultArgs);
                        expect(process).toHaveBeenCalledTimes(2);
                    });
                });
            });
        });

        describe('and @Memo specifies identical id', () => {
            describe('as a function', () => {
                beforeEach(() => {
                    class RunnerImpl implements Runner {
                        @Memo({
                            id: ctxt => ctxt.instance._ref,
                        })
                        process(...args: any[]): any {
                            return process(...args);
                        }

                        constructor(private _ref: string) {}
                    }

                    r1 = new RunnerImpl('r1');
                    r2 = new RunnerImpl('r1');
                });
                it('should use cache from each other', () => {
                    expect(process).not.toHaveBeenCalled();
                    r1.process(...defaultArgs);
                    expect(process).toHaveBeenCalledTimes(1);
                    r2.process(...defaultArgs);
                    expect(process).toHaveBeenCalledTimes(1);
                });
            });

            describe('as a value', () => {
                beforeEach(() => {
                    class RunnerImpl implements Runner {
                        @Memo({
                            id: '1',
                        })
                        process(...args: any[]): any {
                            return process(...args);
                        }

                        constructor(private _ref: string) {}
                    }

                    r1 = new RunnerImpl('r1');
                    r2 = new RunnerImpl('r1');
                });
                it('should use cache from each other', () => {
                    expect(process).not.toHaveBeenCalled();
                    r1.process(...defaultArgs);
                    expect(process).toHaveBeenCalledTimes(1);
                    r2.process(...defaultArgs);
                    expect(process).toHaveBeenCalledTimes(1);
                });
            });
        });
    });

    describe('when memoized method returns Date', () => {
        beforeEach(() => {
            process = jasmine.createSpy('process', () => new Date()).and.callThrough();
        });

        it('should return a Date', () => {
            const res1 = r.process();
            const res2 = r.process();
            expect(process).toHaveBeenCalledTimes(1);
            expect(res2).toEqual(jasmine.any(Date));
            expect(res1).toEqual(res2);
        });
    });

    describe('when memoized method returns an object', () => {
        describe('with Date attributes', () => {
            beforeEach(() => {
                process = jasmine.createSpy('process', () => ({ date: new Date() })).and.callThrough();
            });

            it('should return an object of correct type', () => {
                const res1 = r.process();
                const res2 = r.process();
                expect(process).toHaveBeenCalledTimes(1);
                expect(res2.date).toEqual(jasmine.any(Date));
                expect(res1).toEqual(res2);
            });
        });

        describe('with cyclic references', () => {
            beforeEach(() => {
                process = jasmine
                    .createSpy('process', () => {
                        const a = new CacheableA();
                        const b = new CacheableB();
                        a.a = a;
                        a.b = b;
                        b.a = a;
                        b.b = b;
                        return a;
                    })
                    .and.callThrough();
            });

            it('should return an object with attributes of correct type', () => {
                expect(r.process()).toEqual(r.process());
                expect(process).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('when memoized method returns a class instance', () => {
        describe('annotated with @Cacheable', () => {
            beforeEach(() => {
                process = jasmine.createSpy('process', () => new CacheableA()).and.callThrough();
            });
            it('should return an object of the correct type', () => {
                expect(r.process()).toEqual(r.process());
                expect(process).toHaveBeenCalledTimes(1);
            });

            describe('that contains class instances attributes', () => {
                describe('annotated with @Cacheable', () => {
                    beforeEach(() => {
                        process = jasmine
                            .createSpy('process', () => {
                                const a = new CacheableA();
                                a.b = new CacheableB();
                                return a;
                            })
                            .and.callThrough();
                    });
                    it('should return an object with attributes of correct types', () => {
                        expect(r.process()).toEqual(r.process());
                        expect(r.process().b).toEqual(jasmine.any(CacheableB));
                        expect(process).toHaveBeenCalledTimes(1);
                    });
                });

                describe('not annotated with @Cacheable', () => {
                    beforeEach(() => {
                        process = jasmine
                            .createSpy('process', () => {
                                const a = new CacheableA();
                                a.x = new (class X {})();
                                return a;
                            })
                            .and.callThrough();
                    });

                    it('should throw an error', () => {
                        expect(() => r.process()).toThrow(
                            new TypeError(
                                `Cannot find cache key for object X. Are you sure you are caching a class annotated with "@Cacheable()"?`,
                            ),
                        );
                    });
                });
            });

            describe('that contains Date attributes', () => {
                beforeEach(() => {
                    process = jasmine
                        .createSpy('process', () => {
                            const a = new CacheableA();
                            a.date = new Date();
                            return a;
                        })
                        .and.callThrough();
                });

                it('should return an object with attributes of correct types', () => {
                    expect(r.process()).toEqual(r.process());
                    expect(process).toHaveBeenCalledTimes(1);
                    expect(r.process().date).toEqual(jasmine.any(Date));
                });
            });

            describe('that specifies a version', () => {
                let CachedClass: any;
                let version: () => string;
                beforeEach(() => {
                    @Cacheable({
                        version: () => version(),
                    })
                    // eslint-disable-next-line @typescript-eslint/class-name-casing
                    class _CachedClass {}
                    CachedClass = _CachedClass;
                });
                beforeEach(() => {
                    process = jasmine.createSpy('process', () => new CachedClass()).and.callThrough();
                });
                describe('that differs from the cached one', () => {
                    beforeEach(() => {
                        version = jasmine.createSpy('version', () => `${Math.random()}`).and.callThrough();
                    });
                    it('should invalidate cache', () => {
                        expect(r.process()).toEqual(r.process());
                        expect(process).toHaveBeenCalledTimes(2);
                    });
                });

                describe('with semver format', () => {
                    describe('and the version satisfies the previous one', () => {
                        it('should not invalidate the cache', () => {
                            version = jasmine.createSpy('version', () => '1.2.3').and.callThrough();
                            const res1 = r.process();
                            version = jasmine.createSpy('version', () => '1.5.0').and.callThrough();
                            const res2 = r.process();

                            expect(res1).toEqual(res2);
                            expect(process).toHaveBeenCalledTimes(1);
                        });
                    });

                    describe('and the version does not satisfy the previous one', () => {
                        it('should invalidate the cache', () => {
                            version = jasmine.createSpy('version', () => '1.2.3').and.callThrough();
                            const res1 = r.process();
                            version = jasmine.createSpy('version', () => '2.0.0').and.callThrough();
                            const res2 = r.process();

                            expect(res1).toEqual(res2);
                            expect(process).toHaveBeenCalledTimes(2);
                        });
                    });
                });
            });
        });

        describe('not annotated with @Cacheable', () => {
            beforeEach(() => {
                process = jasmine
                    .createSpy('process', () => {
                        return new (class X {})();
                    })
                    .and.callThrough();
            });
            it('should throw an error', () => {
                expect(() => r.process()).toThrow(
                    new TypeError(
                        `Cannot find cache key for object X. Are you sure you are caching a class annotated with "@Cacheable()"?`,
                    ),
                );
            });
        });
    });

    describe('when memoized method returns null', () => {
        beforeEach(() => {
            process = jasmine.createSpy('process', () => null).and.callThrough();
        });
        it('should return null', () => {
            expect(r.process()).toEqual(r.process());
            expect(process).toHaveBeenCalledTimes(1);
            expect(r.process()).toEqual(null);
        });
    });

    describe('when memoized method returns a boolean', () => {
        beforeEach(() => {
            process = jasmine.createSpy('process', () => false).and.callThrough();
        });
        it('should return the boolean,', () => {
            expect(r.process()).toEqual(r.process());
            expect(process).toHaveBeenCalledTimes(1);
            expect(r.process()).toEqual(false);
        });
    });

    describe('when memoized method returns a number', () => {
        beforeEach(() => {
            process = jasmine.createSpy('process', () => 0).and.callThrough();
        });
        it('should return the number,', () => {
            expect(r.process()).toEqual(r.process());
            expect(process).toHaveBeenCalledTimes(1);
            expect(r.process()).toEqual(0);
        });
    });
    describe('when memoized method returns an array', () => {
        describe('of objects', () => {
            beforeEach(() => {
                process = jasmine
                    .createSpy('process', () => {
                        const a = new CacheableA() as any;
                        a.someProp = 'someProp';
                        return [a, a];
                    })
                    .and.callThrough();
            });
            it('should return an array of objects of correct type', () => {
                expect(r.process()).toEqual(r.process());
                expect(process).toHaveBeenCalledTimes(1);
                expect(r.process()).toEqual(jasmine.any(Array));
                expect(r.process()[0]).toEqual(jasmine.any(CacheableA));
            });
        });

        describe('of dates', () => {
            beforeEach(() => {
                process = jasmine.createSpy('process', () => [new Date(10000), new Date(20000)]).and.callThrough();
            });

            it('should return an array of correct type', () => {
                expect(r.process()).toEqual(r.process());
                expect(process).toHaveBeenCalledTimes(1);
                expect(r.process()).toEqual(jasmine.any(Array));
                expect(r.process()[0]).toEqual(jasmine.any(Date));
            });
        });

        describe('of arrays', () => {
            beforeEach(() => {
                process = jasmine
                    .createSpy('process', () => [
                        ['a', 'b'],
                        ['c', 'd'],
                    ])
                    .and.callThrough();
            });

            it('should return an array of correct type', () => {
                expect(r.process()).toEqual(r.process());
                expect(process).toHaveBeenCalledTimes(1);
                expect(r.process()).toEqual(jasmine.any(Array));
                expect(r.process()[0]).toEqual(jasmine.any(Array));
            });
        });

        describe('with cyclic elements', () => {
            beforeEach(() => {
                process = jasmine
                    .createSpy('process', () => {
                        const arr1 = [] as any[];
                        const arr2 = [] as any[];
                        arr1.push('1', arr1, arr2);
                        arr2.push('2', arr1);

                        return arr1;
                    })
                    .and.callThrough();
            });

            it('should return an array of correct type', () => {
                expect(r.process()).toEqual(r.process());
                expect(process).toHaveBeenCalledTimes(1);
            });
        });
    });
});
