import { Memo } from '../memo';
import { createLocalStorage } from 'localstorage-ponyfill';
import { LsMemoAspect } from './memo-localstorage';
import { LoadTimeWeaver, setWeaver } from '@aspectjs/core';
import moment from 'moment';

interface Runner {
    process(...args: any[]): any;
}

function _setupLsMemoAspect(ls: Storage) {
    setWeaver(
        new LoadTimeWeaver().enable(
            new LsMemoAspect({
                localStorage: ls,
            }),
        ),
    );
}

let r: Runner;
describe('@Memo with LocalStorage aspect', () => {
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

        class RunnerImpl implements Runner {
            @Memo({
                namespace: () => ns,
                expiration: () => expiration,
            })
            process(...args: any[]) {
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
        it('should not conflict with values frol other namespaces', () => {
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

        function testShouldRemoveData(cb: Function) {
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

        function testShouldUseCachedData(cb: Function) {
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

        describe('and @Memo does not specify hashcode', () => {
            describe('and object has no hashcode or id attribute', () => {
                beforeEach(() => {
                    class RunnerImpl implements Runner {
                        @Memo({
                            namespace: () => ns,
                            expiration: () => expiration,
                        })
                        process(...args: any[]) {
                            return process(...args);
                        }
                    }

                    r1 = new RunnerImpl();
                    r2 = new RunnerImpl();
                });
                it('should use cache from each other', () => {
                    expect(process).not.toHaveBeenCalled();
                    r1.process(...defaultArgs);
                    expect(process).toHaveBeenCalledTimes(1);
                    r2.process(...defaultArgs);
                    expect(process).toHaveBeenCalledTimes(1);
                });
            });

            function testShouldNotUseSharedCache() {
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

            describe('and object has hashcode or id attribute', () => {
                function init() {
                    _setupLsMemoAspect(ls);

                    class RunnerImpl implements Runner {
                        constructor(private _hashcode: string) {}
                        @Memo({
                            namespace: () => ns,
                            expiration: () => expiration,
                        })
                        process(...args: any[]) {
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

        xdescribe('and @Memo specifies hashcode', () => {
            describe('as a function', () => {});

            describe('as a value', () => {});
        });
    });
});
