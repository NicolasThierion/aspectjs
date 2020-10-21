import { Memo } from '../../memo.annotation';
import moment from 'moment';
import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';
import { BeforeContext } from '@aspectjs/core';

interface Runner {
    run(...args: any[]): any;
}

describe(`Calling a method annotated with @Memo({type = 'localstorage'})`, () => {
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
        joinpoint = jasmine.createSpy('memoMethodSpy').and.callFake((...args) => args.reverse());
        memoMethod = createMemoMethod((...args: any[]) => joinpoint(...args), {
            namespace: () => memoOptions.namespace,
            id: () => memoOptions.id,
            expiration: () => memoOptions.expiration,
            driver: 'localStorage',
        });

        localStorage.clear();
        setupMemoAspect();
    });

    describe('once', () => {
        it('should call the method once', () => {
            const res = memoMethod(...defaultArgs);
            expect(joinpoint).toHaveBeenCalled();
            expect(res).toEqual([...defaultArgs].reverse());
            expect(joinpoint).toHaveBeenCalledTimes(1);
        });
    });

    describe('twice', () => {
        describe('with the same parameters', () => {
            it('should not invoke the method twice', () => {
                let res = memoMethod(...defaultArgs);
                expect(joinpoint).toHaveBeenCalled();
                res = memoMethod(...defaultArgs);
                expect(res).toEqual([...defaultArgs].reverse());
                expect(joinpoint).toHaveBeenCalledTimes(1);
            });
        });

        describe('with different parameters', () => {
            it('should invoke the method twice', () => {
                let res = memoMethod('a', 'b');
                expect(joinpoint).toHaveBeenCalled();
                res = memoMethod(...defaultArgs);
                expect(res).toEqual([...defaultArgs].reverse());
                expect(joinpoint).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('after the context gets reloaded', () => {
        beforeEach(() => {
            memoMethod(...defaultArgs);

            setupMemoAspect();
        });

        it('should use data cached from previous context', () => {
            const res = memoMethod(...defaultArgs);
            expect(res).toEqual([...defaultArgs].reverse());
            expect(joinpoint).toHaveBeenCalledTimes(1);
        });
    });

    describe('while "namespace" is configured', () => {
        it('should not conflict with values from other namespaces', () => {
            memoOptions.namespace = 'ns1';
            let res = memoMethod(...defaultArgs);
            expect(joinpoint).toHaveBeenCalled();
            memoOptions.namespace = 'ns2';
            res = memoMethod(...defaultArgs);
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

        function testShouldRemoveData(cb: () => void): void {
            expect(joinpoint).toHaveBeenCalled();
            setTimeout(() => {
                const res = memoMethod(...defaultArgs);
                expect(res).toEqual([...defaultArgs].reverse());
                expect(joinpoint).toHaveBeenCalledTimes(2);
                cb();
            }, 1000 * 60 * 3);
            jasmine.clock().tick(1000 * 60 * 3 + 1);
        }

        function testShouldUseCachedData(cb: () => void): void {
            let res = memoMethod(...defaultArgs);
            expect(joinpoint).toHaveBeenCalled();
            setTimeout(() => {
                res = memoMethod(...defaultArgs);
                expect(res).toEqual([...defaultArgs].reverse());
                expect(joinpoint).toHaveBeenCalledTimes(1);
                cb();
            }, 1000 * 60);
            jasmine.clock().tick(1000 * 60 + 1);
        }

        describe('as a date', () => {
            beforeEach(() => {
                memoOptions.expiration = moment(initDate).add(2, 'm').toDate();
            });

            describe('when data did not expire', () => {
                it('should use cached data', testShouldUseCachedData);
            });

            describe('when data did expire', () => {
                it('should remove cached data', (cb) => {
                    memoMethod(...defaultArgs);
                    testShouldRemoveData(cb);
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
                it('should remove cached data', (cb) => {
                    memoMethod(...defaultArgs);
                    testShouldRemoveData(cb);
                });

                describe('after the context has been reloaded', () => {
                    beforeEach(() => {
                        memoMethod(...defaultArgs);
                        expect(joinpoint).toHaveBeenCalledTimes(1);
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
        let run: Runner['run'];
        let idFn = (ctxt: BeforeContext) => undefined as string;
        class RunnerImpl implements Runner {
            constructor(props?: Record<string, unknown>) {
                Object.assign(this, props);
            }
            @Memo({
                id: (ctxt) => idFn(ctxt),
            })
            run(...args: any[]): any {
                return run(...args);
            }
        }

        beforeEach(() => {
            r1 = new RunnerImpl();
            r2 = new RunnerImpl();
            run = jasmine.createSpy('memoMethod');
            idFn = (ctxt: BeforeContext) => undefined as string;
        });

        describe('and @Memo does not specify id', () => {
            describe('and object has no id or id attribute', () => {
                it('should not use cache from each other', () => {
                    expect(run).not.toHaveBeenCalled();
                    r1.run(...defaultArgs);
                    expect(run).toHaveBeenCalledTimes(1);
                    r2.run(...defaultArgs);
                    expect(run).toHaveBeenCalledTimes(2);
                });
            });

            function testShouldNotUseSharedCache(): void {
                expect(run).not.toHaveBeenCalled();
                r1.run(...defaultArgs);
                expect(run).toHaveBeenCalledTimes(1);
                r1.run(...defaultArgs);
                expect(run).toHaveBeenCalledTimes(1);
                r2.run(...defaultArgs);
                expect(run).toHaveBeenCalledTimes(2);
                r2.run(...defaultArgs);
                expect(run).toHaveBeenCalledTimes(2);
            }

            describe('and object has id attribute', () => {
                beforeEach(() => {
                    r1 = new RunnerImpl({ id: '1' });
                    r2 = new RunnerImpl({ id: '2' });
                });

                it('should not use cache from each other', testShouldNotUseSharedCache);

                describe('after the context gets reloaded', () => {
                    beforeEach(() => {
                        r1.run(...defaultArgs);
                        r2.run(...defaultArgs);
                        setupMemoAspect();
                    });
                    it('should not use cache from each other', () => {
                        expect(run).toHaveBeenCalledTimes(2);
                        r1.run(...defaultArgs);
                        expect(run).toHaveBeenCalledTimes(2);
                        r2.run(...defaultArgs);
                        expect(run).toHaveBeenCalledTimes(2);
                    });
                });
            });
        });

        describe('and @Memo specifies identical id', () => {
            describe('as a function', () => {
                beforeEach(() => {
                    idFn = (ctxt: BeforeContext<any>) => ctxt.instance._ref;
                    r1 = new RunnerImpl({ _ref: 'r1' });
                    r2 = new RunnerImpl({ _ref: 'r1' });
                });
                it('should use cache from each other', () => {
                    expect(run).not.toHaveBeenCalled();
                    r1.run(...defaultArgs);
                    expect(run).toHaveBeenCalledTimes(1);
                    r2.run(...defaultArgs);
                    expect(run).toHaveBeenCalledTimes(1);
                });
            });

            describe('as a value', () => {
                beforeEach(() => {
                    class RunnerImpl implements Runner {
                        @Memo({
                            id: '1',
                        })
                        run(...args: any[]): any {
                            return run(...args);
                        }

                        constructor() {}
                    }

                    r1 = new RunnerImpl();
                    r2 = new RunnerImpl();
                });
                it('should use cache from each other', () => {
                    expect(run).not.toHaveBeenCalled();
                    r1.run(...defaultArgs);
                    expect(run).toHaveBeenCalledTimes(1);
                    r2.run(...defaultArgs);
                    expect(run).toHaveBeenCalledTimes(1);
                });
            });
        });
    });
});
