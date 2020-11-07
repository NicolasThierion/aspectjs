import { MemoDriver } from './drivers';
import { MemoKey } from './memo.types';
import { Memo } from './memo.annotation';
import { InstantPromise } from './utils';
import { MarshallingContext } from './marshalling/marshalling-context';
import { setupMemoAspect } from './utils/spec-helpers';

interface Runner {
    process(...args: any[]): any;
}

let processFn: (...args: any[]) => any;

function _createRunner(driver?: typeof MemoDriver | string) {
    processFn = processFn ?? jasmine.createSpy('process');
    class RunnerImpl implements Runner {
        @Memo({
            driver,
        })
        process(...args: any[]): any {
            return processFn(...args);
        }
    }

    return new RunnerImpl();
}

class DummyDriver extends MemoDriver {
    constructor(public readonly name: string, public priority: number, public _accepts: boolean) {
        super();
    }
    get NAME(): string {
        return this.name;
    }

    protected read(key: MemoKey): any {}

    protected doRemove(key: MemoKey): PromiseLike<void> {
        return InstantPromise.resolve();
    }

    protected write(key: MemoKey, value: any): PromiseLike<void> {
        return InstantPromise.resolve();
    }

    getKeys(namespace?: string): Promise<MemoKey[]> {
        return Promise.resolve([]);
    }
    accepts(context: MarshallingContext) {
        return this._accepts;
    }

    getPriority(context: MarshallingContext): number {
        return this.priority;
    }
}

describe('MemoAspect', () => {
    let driver1: DummyDriver;
    let driver2: DummyDriver;
    let r: Runner;

    beforeEach(() => {
        processFn = jasmine.createSpy('process');
        driver1 = new (class extends DummyDriver {})('driver1', 1, true);
        driver2 = new (class extends DummyDriver {})('driver2', 2, true);
        [driver1, driver2].forEach((d) => {
            spyOn(d, 'getValue').and.callThrough();
            spyOn(d, 'setValue').and.callThrough();
        });

        setupMemoAspect({
            drivers: [driver1, driver2],
        });
    });
    describe('given an advice', () => {
        describe('that do not specify driver type', () => {
            beforeEach(() => (r = _createRunner()));

            it('should select the driver with highest priority', () => {
                expect(driver1.setValue).not.toHaveBeenCalled();
                expect(driver2.setValue).not.toHaveBeenCalled();
                r.process();
                expect(driver1.setValue).not.toHaveBeenCalled();
                expect(driver2.setValue).toHaveBeenCalled();
            });
        });
        describe('that specifies driver type', () => {
            describe('as a string', () => {
                beforeEach(() => (r = _createRunner(driver1.NAME)));
                it('should select that driver', () => {
                    expect(driver1.getValue).not.toHaveBeenCalled();
                    expect(driver2.getValue).not.toHaveBeenCalled();
                    r.process();
                    expect(driver1.getValue).toHaveBeenCalled();
                    expect(driver2.getValue).not.toHaveBeenCalled();
                });

                describe('but there is no driver for this type', () => {
                    beforeEach(() => (r = _createRunner('invalidDriverName')));

                    it('should throw an error', () => {
                        expect(() => r.process()).toThrow(
                            new Error(
                                '@Memo on method "RunnerImpl.process": No candidate driver available for driver name "invalidDriverName"',
                            ),
                        );
                    });
                });
                describe('but the specified driver do not accept the return value', () => {
                    beforeEach(() => {
                        r = _createRunner(driver1.NAME);
                        processFn = jasmine.createSpy('process').and.callFake(() => {
                            return 'UnsupportedValue';
                        });
                        driver1._accepts = false;
                    });

                    it('should throw an error', () => {
                        expect(() => r.process()).toThrow(
                            new Error(
                                '@Memo on method "RunnerImpl.process": Driver driver1 does not accept value of type String returned by method "RunnerImpl.process"',
                            ),
                        );
                    });
                });
            });

            describe('as a Class', () => {
                beforeEach(() => (r = _createRunner(Reflect.getPrototypeOf(driver1).constructor as any)));

                it('should select that driver', () => {
                    expect(driver1.getValue).not.toHaveBeenCalled();
                    expect(driver2.getValue).not.toHaveBeenCalled();
                    r.process();
                    expect(driver1.getValue).toHaveBeenCalled();
                    expect(driver2.getValue).not.toHaveBeenCalled();
                });

                describe('but there is no driver for this type', () => {
                    beforeEach(() => (r = _createRunner(class X {} as any)));

                    it('should throw an error', () => {
                        expect(() => r.process()).toThrow(
                            new Error(
                                '@Memo on method "RunnerImpl.process": No candidate driver available for driver "X"',
                            ),
                        );
                    });
                });
                describe('but the specified driver do not accept the return value', () => {
                    beforeEach(() => {
                        r = _createRunner(Reflect.getPrototypeOf(driver1).constructor as any);
                        processFn = jasmine.createSpy('process').and.callFake(() => {
                            return 'UnsupportedValue';
                        });
                        driver1._accepts = false;
                    });

                    it('should throw an error', () => {
                        expect(() => r.process()).toThrow(
                            new Error(
                                '@Memo on method "RunnerImpl.process": Driver driver1 does not accept value of type String returned by method "RunnerImpl.process"',
                            ),
                        );
                        //    @Memo on method "RunnerImpl.process": Driver driver1 does not accept value of type UnsupportedValue returned by method RunnerImpl.process
                        //    @Memo on method "RunnerImpl.process": Driver driver1 does not accept value of type UnsupportedValue returned by method "RunnerImpl.process"
                    });
                });
            });
        });
    });
});
