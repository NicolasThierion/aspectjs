import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';
import { IdbMemoDriver, LsMemoDriver } from '../../drivers';

describe('Calling a @Memo method that returns a Promise', () => {
    [LsMemoDriver.NAME, IdbMemoDriver.NAME].forEach((driverName) => {
        let joinpoint: jasmine.Spy;
        let memoMethod: () => Promise<any>;

        describe(`when @Memo is configured with driver "${driverName}"`, () => {
            beforeEach(() => {
                setupMemoAspect();
                joinpoint = jasmine.createSpy('methodSpy').and.callFake((...args: any[]) => Promise.resolve());
                memoMethod = createMemoMethod((...args: any[]) => joinpoint(args), {
                    driver: driverName,
                });
                localStorage.clear();
            });

            describe('calling the method twice', () => {
                describe('while the promise is not resolved yet', () => {
                    it('should return a promise', () => {
                        expect(memoMethod()).toEqual(jasmine.any(Promise));
                        expect(memoMethod()).toEqual(jasmine.any(Promise));
                    });

                    it('should call the real method once', () => {
                        memoMethod();
                        memoMethod();

                        expect(joinpoint).toHaveBeenCalledTimes(1);
                    });
                });
            });

            describe('when the promise is resolved', () => {
                beforeEach(() => {
                    joinpoint = jasmine
                        .createSpy('methodSpy', (...args: any[]) => Promise.resolve('value'))
                        .and.callThrough();
                });

                it('should resolve to the cached value', async () => {
                    const value1 = await memoMethod();
                    const value2 = await memoMethod();
                    expect(value1).toEqual('value');
                    expect(value2).toEqual('value');
                });
            });
        });
    });
});
