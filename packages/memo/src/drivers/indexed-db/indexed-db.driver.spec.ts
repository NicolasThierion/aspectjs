import { Memo } from '../../memo.annotation';
import { JitWeaver, setWeaver } from '@aspectjs/core';
import moment from 'moment';
import { DefaultCacheableAspect } from '../../cacheable/cacheable.aspect';
import { Cacheable } from '../../cacheable/cacheable.annotation';
import { MemoAspect } from '../../memo.aspect';
import { IdbMemoDriver } from './idb-memo.driver';
import { LsMemoDriver } from '../localstorage/localstorage.driver';
import { DEFAULT_MARSHALLERS } from '../../profiles/default.profile';

// eslint-disable-next-line @typescript-eslint/no-var-requires

interface Runner {
    process(...args: any[]): any;
}

let CacheableA: any;
let CacheableB: any;
function _setupIdbMemoAspect(): void {
    setWeaver(
        new JitWeaver().enable(
            new MemoAspect().drivers(
                new IdbMemoDriver({
                    marshallers: DEFAULT_MARSHALLERS,
                }),
                new LsMemoDriver({
                    marshallers: DEFAULT_MARSHALLERS,
                }),
            ),
            new DefaultCacheableAspect(),
        ),
    );
}

describe(`IdbMemoDriver`, () => {
    describe(`when calling a method annotated with @Memo({type = 'indexedDb'})`, () => {
        let r: Runner;
        let process: Runner['process'];
        let ns: string;
        const ls = localStorage;
        let expiration: Date | number;

        const defaultArgs = ['a', 'b', 'c', 'd'];

        beforeEach(() => {
            ns = undefined;
            ls.clear();

            _setupIdbMemoAspect();

            @Cacheable()
            class _CacheableA {}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            CacheableA = _CacheableA;
            @Cacheable()
            class _CacheableB {}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            CacheableB = _CacheableB;

            class RunnerImpl implements Runner {
                @Memo({
                    namespace: () => ns,
                    expiration: () => expiration,
                    driver: 'indexedDb',
                })
                process(...args: any[]): any {
                    return process(...args);
                }
            }

            r = new RunnerImpl();
            process = jasmine
                .createSpy('process', function _process(...args: any[]) {
                    return Promise.resolve([...args].reverse());
                })
                .and.callThrough();
        });

        describe('once', () => {
            it('should call the method once', async () => {
                const res = r.process(...defaultArgs);
                expect(process).toHaveBeenCalled();
                expect(await res).toEqual([...defaultArgs].reverse());
                expect(process).toHaveBeenCalledTimes(1);
            });
        });

        describe('twice', () => {
            describe('with the same parameters', () => {
                it('should not invoke the method twice', async () => {
                    const [p1, p2] = [r.process(...defaultArgs), r.process(...defaultArgs)];
                    expect(process).toHaveBeenCalledTimes(1);
                    const [r1, r2] = [await p1, await p2];
                    expect(r1).toEqual([...defaultArgs].reverse());
                    expect(r2).toEqual([...defaultArgs].reverse());

                    return Promise.resolve().then(async () => {
                        const [p3, p4] = [r.process(...defaultArgs), r.process(...defaultArgs)];
                        const [r3, r4] = [await p3, await p4];

                        expect(r3).toEqual([...defaultArgs].reverse());
                        expect(r4).toEqual([...defaultArgs].reverse());
                        expect(process).toHaveBeenCalledTimes(1);
                    });
                });
            });

            describe('with different parameters', () => {
                it('should invoke the method twice', async () => {
                    let res = r.process('a', 'b');
                    expect(process).toHaveBeenCalled();
                    res = await r.process(...defaultArgs);
                    expect(res).toEqual([...defaultArgs].reverse());
                    expect(process).toHaveBeenCalledTimes(2);
                });
            });
        });

        describe('after the context gets reloaded', () => {
            beforeEach(async () => {
                await r.process(...defaultArgs);

                _setupIdbMemoAspect();
            });

            it('should use data cached from previous context', async () => {
                let res: any;
                await new Promise((resolve) => {
                    setTimeout(async () => {
                        res = await r.process(...defaultArgs);
                        resolve();
                    }, 100);
                });

                expect(res).toEqual([...defaultArgs].reverse());
                expect(process).toHaveBeenCalledTimes(1);
            });
        });

        describe('while "namespace" is configured', () => {
            it('should not conflict with values from other namespaces', async () => {
                ns = 'ns1';
                let res = await r.process(...defaultArgs);
                expect(process).toHaveBeenCalled();
                ns = 'ns2';
                res = await r.process(...defaultArgs);
                expect(res).toEqual([...defaultArgs].reverse());
                expect(process).toHaveBeenCalledTimes(2);
            });
        });

        describe('while "expiration" is configured', () => {
            const initDate = new Date();
            beforeEach(() => {
                jasmine.clock().install();
                jasmine.clock().mockDate(initDate);
            });
            afterEach(() => {
                jasmine.clock().uninstall();
            });

            function testShouldRemoveData(): Promise<void> {
                expect(process).toHaveBeenCalled();

                const p = new Promise((resolve) => {
                    setTimeout(resolve, 1000 * 60 * 3);
                }).then(async () => {
                    const res = await r.process(...defaultArgs);
                    expect(res).toEqual([...defaultArgs].reverse());
                    expect(process).toHaveBeenCalledTimes(2);
                });
                Promise.resolve().then(() => {
                    jasmine.clock().tick(1000 * 60 * 3 + 1);
                });

                return p;
            }

            async function testShouldUseCachedData() {
                let res = await r.process(...defaultArgs);
                expect(process).toHaveBeenCalled();

                const p = new Promise((resolve) => {
                    setTimeout(resolve, 1000 * 60);
                }).then(async () => {
                    res = await r.process(...defaultArgs);
                    expect(res).toEqual([...defaultArgs].reverse());
                    expect(process).toHaveBeenCalledTimes(1);
                });

                Promise.resolve().then(() => {
                    jasmine.clock().tick(1000 * 60 + 1);
                });

                return p;
            }

            describe('as a date', () => {
                beforeEach(() => {
                    expiration = moment(initDate).add(2, 'm').toDate();
                });

                describe('when data did not expire', () => {
                    it('should use cached data', testShouldUseCachedData);
                });

                describe('when data did expire', () => {
                    it('should remove cached data', async () => {
                        r.process(...defaultArgs);
                        await testShouldRemoveData();
                    });

                    describe('after the context has been reloaded', () => {
                        beforeEach(() => {
                            r.process(...defaultArgs);

                            _setupIdbMemoAspect();
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
                    it('should remove cached data', async () => {
                        r.process(...defaultArgs);

                        await testShouldRemoveData();
                    });

                    describe('after the context has been reloaded', () => {
                        beforeEach(() => {
                            r.process(...defaultArgs);

                            _setupIdbMemoAspect();
                        });

                        it('should remove cached data', testShouldRemoveData);
                    });
                });
            });
        });

        describe('on two different instances', () => {
            let r1: Runner;
            let r2: Runner;

            describe('and @Memo does not specify id', () => {
                describe('and object has no id or _id attribute', () => {
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

                describe('and object has id or _id attribute', () => {
                    function init(): void {
                        _setupIdbMemoAspect();

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
                        beforeEach(async () => {
                            r1.process(...defaultArgs);
                            r2.process(...defaultArgs);
                            init();
                            return new Promise<any>((r) => {
                                setTimeout(r); // let some time to write onto IDB before reload
                            });
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
                                id: (ctxt) => ctxt.instance._ref,
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

        function nonAsyncShouldThrow(returnValue: any) {
            return () => {
                beforeEach(() => {
                    process = jasmine.createSpy('process', () => returnValue).and.callThrough();
                });

                it('should throw an Error', () => {
                    expect(() => {
                        r.process();
                    }).toThrow(
                        new Error(
                            `@Memo on method "RunnerImpl.process": Driver indexedDb does not accept value ${returnValue} returned by memoized method`,
                        ),
                    );
                });
            };
        }

        describe('that returns a Date', nonAsyncShouldThrow(new Date()));

        describe('that returns an object', nonAsyncShouldThrow({}));

        describe('that returns null', nonAsyncShouldThrow(null));

        describe('that returns undefined', nonAsyncShouldThrow(undefined));

        describe('that returns a boolean', nonAsyncShouldThrow(false));

        describe('that returns a number', nonAsyncShouldThrow(12));

        describe('that returns an array', nonAsyncShouldThrow([Promise.resolve()]));

        describe('that returns a promise', () => {
            beforeEach(() => {
                process = jasmine.createSpy('methodSpy', (...args: any[]) => new Promise(() => {})).and.callThrough();
            });

            describe('when the promise is not resolved', () => {
                describe('calling the method twice', () => {
                    it('should return a promise', () => {
                        expect(r.process()).toEqual(jasmine.any(Promise));
                        expect(r.process()).toEqual(jasmine.any(Promise));
                    });

                    it('should call the real method once', () => {
                        r.process();
                        r.process();

                        expect(process).toHaveBeenCalledTimes(1);
                    });
                });
            });

            describe('when the promise is resolved', () => {
                beforeEach(() => {
                    process = jasmine
                        .createSpy('methodSpy', (...args: any[]) => Promise.resolve('value'))
                        .and.callThrough();
                });

                it('should resolve to the cached value', async () => {
                    const value1 = await r.process();
                    const value2 = await r.process();
                    expect(value1).toEqual(value2);
                });
            });
        });
    });
});
