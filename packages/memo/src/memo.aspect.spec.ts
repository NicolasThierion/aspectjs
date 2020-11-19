import { MemoDriver } from './drivers';
import { MarshallingContext } from './marshalling/marshalling-context';
import { Memo } from './memo.annotation';
import { MemoEntry, MemoKey } from './memo.types';
import { InstantPromise } from './utils';
import { setupMemoAspect } from './utils/spec-helpers';

interface Runner {
    process(...args: any[]): any;
}

let processFn: (...args: any[]) => any;

function _createMemoizedFunction(driver?: typeof MemoDriver | string) {
    class RunnerImpl implements Runner {
        @Memo({
            driver,
        })
        process(...args: any[]): any {
            return (() => processFn(...args))();
        }
    }

    return new RunnerImpl();
}

class SimpleRamDriver extends MemoDriver {
    private cache: Record<string, MemoEntry> = {};

    constructor(public readonly name: string, public priority: number, public _accepts: boolean) {
        super();
    }
    get NAME(): string {
        return this.name;
    }

    read(key: MemoKey): MemoEntry {
        const entry = this.cache[key.toString()];

        return entry ? { ...entry, frame: { ...entry.frame } as any } : undefined;
    }

    remove(key: MemoKey): PromiseLike<void> {
        delete this.cache[key.toString()];
        return InstantPromise.resolve();
    }

    write(entry: MemoEntry): PromiseLike<void> {
        this.cache[entry.key.toString()] = { ...entry, frame: { ...entry.frame } as any };

        return InstantPromise.resolve();
    }

    getKeys(namespace?: string): Promise<MemoKey[]> {
        return Promise.resolve(Object.keys(this.cache).map((s) => MemoKey.parse(s)));
    }
    accepts(context: MarshallingContext) {
        return this._accepts;
    }

    getPriority(context: MarshallingContext): number {
        return this.priority;
    }
}

describe('MemoAspect', () => {
    let driver1: SimpleRamDriver;
    let driver2: SimpleRamDriver;
    let r: Runner;

    beforeEach(() => {
        processFn = jasmine.createSpy('process').and.callFake(() => ({
            value: 'value',
        }));
        driver1 = new (class extends SimpleRamDriver {})('driver1', 1, true);
        driver2 = new (class extends SimpleRamDriver {})('driver2', 2, true);
        [driver1, driver2].forEach((d) => {
            spyOn(d, 'read').and.callThrough();
            spyOn(d, 'write').and.callThrough();
        });

        localStorage.clear();
        setupMemoAspect({
            drivers: [driver1, driver2],
        });
    });
    describe('with @Memo()', () => {
        describe('when calling a method once', () => {
            beforeEach(() => (r = _createMemoizedFunction()));

            it('should select the driver with highest priority', () => {
                expect(driver1.write).not.toHaveBeenCalled();
                expect(driver2.write).not.toHaveBeenCalled();
                r.process();
                expect(driver1.write).not.toHaveBeenCalled();
                expect(driver2.write).toHaveBeenCalled();
            });
        });

        describe('when calling a method twice', () => {
            beforeEach(() => (r = _createMemoizedFunction()));

            it('should use the cache', () => {
                expect(processFn).not.toHaveBeenCalled();
                r.process();
                r.process();
                r.process();
                expect(processFn).toHaveBeenCalledTimes(1);
                r.process();
                expect(processFn).toHaveBeenCalledTimes(1);
            });

            describe('and the context has been reloaded between calls', () => {
                it('should use the cache', () => {
                    setupMemoAspect();
                    expect(processFn).not.toHaveBeenCalled();
                    r.process();
                    expect(processFn).toHaveBeenCalledTimes(1);
                    setupMemoAspect();
                    r.process();
                    expect(processFn).toHaveBeenCalledTimes(1);
                });
            });
            describe('and the method changed between the two calls', () => {
                it('should invalidate the cache', () => {
                    setupMemoAspect();
                    expect(processFn).not.toHaveBeenCalled();
                    r.process();
                    expect(processFn).toHaveBeenCalledTimes(1);
                    setupMemoAspect();
                    r.process.toString = () => 'process() { console.log("new method body") }';
                    r.process();
                    expect(processFn).toHaveBeenCalledTimes(2);
                });
            });
        });
    });
    describe('with @Memo({driver: `DriverName`})', () => {
        describe('when calling a method once', () => {
            beforeEach(() => (r = _createMemoizedFunction(driver1.NAME)));
            it('should select that driver', () => {
                expect(driver1.read).not.toHaveBeenCalled();
                expect(driver2.read).not.toHaveBeenCalled();
                r.process();
                expect(driver1.read).toHaveBeenCalled();
                expect(driver2.read).not.toHaveBeenCalled();
            });

            describe('but there is no driver for the given type', () => {
                beforeEach(() => (r = _createMemoizedFunction('invalidDriverName')));

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
                    r = _createMemoizedFunction(driver1.NAME);
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
    });
    describe('with @Memo({driver: DriverClass})', () => {
        describe('when calling a method once', () => {
            beforeEach(() => (r = _createMemoizedFunction(Reflect.getPrototypeOf(driver1).constructor as any)));

            it('should select that driver', () => {
                expect(driver1.read).not.toHaveBeenCalled();
                expect(driver2.read).not.toHaveBeenCalled();
                r.process();
                expect(driver1.read).toHaveBeenCalled();
                expect(driver2.read).not.toHaveBeenCalled();
            });

            describe('but there is no driver for this type', () => {
                beforeEach(() => (r = _createMemoizedFunction(class X {} as any)));

                it('should throw an error', () => {
                    expect(() => r.process()).toThrow(
                        new Error('@Memo on method "RunnerImpl.process": No candidate driver available for driver "X"'),
                    );
                });
            });
            describe('but the specified driver do not accept the return value', () => {
                beforeEach(() => {
                    r = _createMemoizedFunction(Reflect.getPrototypeOf(driver1).constructor as any);
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
    });
});
