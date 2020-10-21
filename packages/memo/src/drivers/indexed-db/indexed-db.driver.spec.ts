import { Memo } from '../../memo.annotation';
import moment from 'moment';
import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';

// eslint-disable-next-line @typescript-eslint/no-var-requires

interface Runner {
    run(...args: any[]): any;
}

describe(`IdbMemoDriver`, () => {
    describe(`when calling a method annotated with @Memo({type = 'indexedDb'})`, () => {
        let joinpoint: jasmine.Spy;
        let memoMethod: (...args: any[]) => any;
        let memoOptions: {
            id?: string;
            namespace?: string;
            expiration?: Date | number;
        };

        const defaultArgs = ['a', 'b', 'c', 'd'];

        beforeEach(() => {
            memoOptions = {};
            joinpoint = jasmine.createSpy('memoMethodSpy').and.callFake((...args) => Promise.resolve(args.reverse()));
            memoMethod = createMemoMethod((...args: any[]) => joinpoint(...args), {
                namespace: () => memoOptions.namespace,
                id: () => memoOptions.id,
                expiration: () => memoOptions.expiration,
                driver: 'indexedDb',
            });

            localStorage.clear();

            setupMemoAspect();
        });

        describe('once', () => {
            it('should call the method once', async () => {
                const res = memoMethod(...defaultArgs);
                expect(joinpoint).toHaveBeenCalled();
                expect(await res).toEqual([...defaultArgs].reverse());
                expect(joinpoint).toHaveBeenCalledTimes(1);
            });
        });

        describe('twice', () => {
            describe('with the same parameters', () => {
                it('should not invoke the method twice', async () => {
                    const [p1, p2] = [memoMethod(...defaultArgs), memoMethod(...defaultArgs)];
                    expect(joinpoint).toHaveBeenCalledTimes(1);
                    const [r1, r2] = [await p1, await p2];
                    expect(r1).toEqual([...defaultArgs].reverse());
                    expect(r2).toEqual([...defaultArgs].reverse());

                    return Promise.resolve().then(async () => {
                        const [p3, p4] = [memoMethod(...defaultArgs), memoMethod(...defaultArgs)];
                        const [r3, r4] = [await p3, await p4];

                        expect(r3).toEqual([...defaultArgs].reverse());
                        expect(r4).toEqual([...defaultArgs].reverse());
                        expect(joinpoint).toHaveBeenCalledTimes(1);
                    });
                });
            });

            describe('with different parameters', () => {
                it('should invoke the method twice', async () => {
                    let res = memoMethod('a', 'b');
                    expect(joinpoint).toHaveBeenCalled();
                    res = await memoMethod(...defaultArgs);
                    expect(res).toEqual([...defaultArgs].reverse());
                    expect(joinpoint).toHaveBeenCalledTimes(2);
                });
            });
        });

        describe('after the context gets reloaded', () => {
            beforeEach(async () => {
                await memoMethod(...defaultArgs);

                setupMemoAspect();
            });

            it('should use data cached from previous context', async () => {
                let res: any;
                await new Promise((resolve) => {
                    setTimeout(async () => {
                        res = await memoMethod(...defaultArgs);
                        resolve();
                    }, 100);
                });

                expect(res).toEqual([...defaultArgs].reverse());
                expect(joinpoint).toHaveBeenCalledTimes(1);
            });
        });

        describe('while "namespace" is configured', () => {
            it('should not conflict with values from other namespaces', async () => {
                memoOptions.namespace = 'ns1';
                let res = await memoMethod(...defaultArgs);
                expect(joinpoint).toHaveBeenCalled();
                memoOptions.namespace = 'ns2';
                res = await memoMethod(...defaultArgs);
                expect(res).toEqual([...defaultArgs].reverse());
                expect(joinpoint).toHaveBeenCalledTimes(2);
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
                expect(joinpoint).toHaveBeenCalled();

                const p = new Promise((resolve) => {
                    setTimeout(resolve, 1000 * 60 * 3);
                }).then(async () => {
                    const res = await memoMethod(...defaultArgs);
                    expect(res).toEqual([...defaultArgs].reverse());
                    expect(joinpoint).toHaveBeenCalledTimes(2);
                });
                Promise.resolve().then(() => {
                    jasmine.clock().tick(1000 * 60 * 3 + 1);
                });

                return p;
            }

            async function testShouldUseCachedData() {
                let res = await memoMethod(...defaultArgs);
                expect(joinpoint).toHaveBeenCalled();

                const p = new Promise((resolve) => {
                    setTimeout(resolve, 1000 * 60);
                }).then(async () => {
                    res = await memoMethod(...defaultArgs);
                    expect(res).toEqual([...defaultArgs].reverse());
                    expect(joinpoint).toHaveBeenCalledTimes(1);
                });

                Promise.resolve().then(() => {
                    jasmine.clock().tick(1000 * 60 + 1);
                });

                return p;
            }

            describe('as a date', () => {
                beforeEach(() => {
                    memoOptions.expiration = moment(initDate).add(2, 'm').toDate();
                });

                describe('when data did not expire', () => {
                    it('should use cached data', testShouldUseCachedData);
                });

                describe('when data did expire', () => {
                    it('should remove cached data', async () => {
                        memoMethod(...defaultArgs);
                        await testShouldRemoveData();
                    });

                    describe('after the context has been reloaded', () => {
                        beforeEach(() => {
                            memoMethod(...defaultArgs);

                            setupMemoAspect();
                        });

                        it('should remove cached data', testShouldRemoveData);
                    });
                });
            });

            describe('as a number', () => {
                beforeEach(() => {
                    memoOptions.expiration = 2 * 60;
                });
                describe('when data did not expire', () => {
                    it('should use cached data', testShouldUseCachedData);
                });

                describe('when data did expire', () => {
                    it('should remove cached data', async () => {
                        memoMethod(...defaultArgs);

                        await testShouldRemoveData();
                    });

                    describe('after the context has been reloaded', () => {
                        beforeEach(() => {
                            memoMethod(...defaultArgs);

                            setupMemoAspect();
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
                            run(...args: any[]): any {
                                return joinpoint(...args);
                            }
                        }

                        r1 = new RunnerImpl();
                        r2 = new RunnerImpl();
                    });
                    it('should not use cache from each other', () => {
                        expect(joinpoint).not.toHaveBeenCalled();
                        r1.run(...defaultArgs);
                        expect(joinpoint).toHaveBeenCalledTimes(1);
                        r2.run(...defaultArgs);
                        expect(joinpoint).toHaveBeenCalledTimes(2);
                    });
                });

                function testShouldNotUseSharedCache(): void {
                    expect(joinpoint).not.toHaveBeenCalled();
                    r1.run(...defaultArgs);
                    expect(joinpoint).toHaveBeenCalledTimes(1);
                    r1.run(...defaultArgs);
                    expect(joinpoint).toHaveBeenCalledTimes(1);
                    r2.run(...defaultArgs);
                    expect(joinpoint).toHaveBeenCalledTimes(2);
                    r2.run(...defaultArgs);
                    expect(joinpoint).toHaveBeenCalledTimes(2);
                }

                describe('and object has id or _id attribute', () => {
                    function init(): void {
                        setupMemoAspect();

                        class RunnerImpl implements Runner {
                            constructor(private id: string) {}
                            @Memo({})
                            run(...args: any[]): any {
                                return joinpoint(...args);
                            }
                        }

                        r1 = new RunnerImpl('1');
                        r2 = new RunnerImpl('2');
                    }
                    beforeEach(init);

                    it('should not use cache from each other', testShouldNotUseSharedCache);

                    describe('after the context gets reloaded', () => {
                        beforeEach(async () => {
                            r1.run(...defaultArgs);
                            r2.run(...defaultArgs);
                            init();
                            return new Promise<any>((r) => {
                                setTimeout(r); // let some time to write onto IDB before reload
                            });
                        });
                        it('should not use cache from each other', () => {
                            expect(joinpoint).toHaveBeenCalledTimes(2);
                            r1.run(...defaultArgs);
                            expect(joinpoint).toHaveBeenCalledTimes(2);
                            r2.run(...defaultArgs);
                            expect(joinpoint).toHaveBeenCalledTimes(2);
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
                            run(...args: any[]): any {
                                return joinpoint(...args);
                            }

                            constructor(private _ref: string) {}
                        }

                        r1 = new RunnerImpl('r1');
                        r2 = new RunnerImpl('r1');
                    });
                    it('should use cache from each other', () => {
                        expect(joinpoint).not.toHaveBeenCalled();
                        r1.run(...defaultArgs);
                        expect(joinpoint).toHaveBeenCalledTimes(1);
                        r2.run(...defaultArgs);
                        expect(joinpoint).toHaveBeenCalledTimes(1);
                    });
                });

                describe('as a value', () => {
                    beforeEach(() => {
                        class RunnerImpl implements Runner {
                            @Memo({
                                id: '1',
                            })
                            run(...args: any[]): any {
                                return joinpoint(...args);
                            }

                            constructor(private _ref: string) {}
                        }

                        r1 = new RunnerImpl('r1');
                        r2 = new RunnerImpl('r1');
                    });
                    it('should use cache from each other', () => {
                        expect(joinpoint).not.toHaveBeenCalled();
                        r1.run(...defaultArgs);
                        expect(joinpoint).toHaveBeenCalledTimes(1);
                        r2.run(...defaultArgs);
                        expect(joinpoint).toHaveBeenCalledTimes(1);
                    });
                });
            });
        });

        function nonAsyncShouldThrow(returnValue: any, type: string) {
            return () => {
                beforeEach(() => {
                    joinpoint = jasmine.createSpy('joinpoint').and.callFake(() => returnValue);
                });

                it('should throw an Error', () => {
                    expect(() => {
                        memoMethod();
                    }).toThrow(
                        new Error(
                            `@Memo on method "MemoClassImpl.memoMethod": Driver indexedDb does not accept value of type ${type} returned by method "MemoClassImpl.memoMethod"`,
                        ),
                    );
                });
            };
        }

        describe('that returns a Date', nonAsyncShouldThrow(new Date(), 'Date'));

        describe('that returns an object', nonAsyncShouldThrow({}, 'Object'));

        describe('that returns null', nonAsyncShouldThrow(null, 'object'));

        describe('that returns undefined', nonAsyncShouldThrow(undefined, 'undefined'));

        describe('that returns a boolean', nonAsyncShouldThrow(false, 'Boolean'));

        describe('that returns a number', nonAsyncShouldThrow(12, 'Number'));

        describe('that returns an array', nonAsyncShouldThrow([Promise.resolve()], 'Array'));
    });
});
