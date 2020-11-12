import { createMemoMethod, setupMemoAspect } from '../../utils/spec-helpers';
import { IdbMemoDriver, LsMemoDriver } from '../../drivers';
import { Observable, of } from 'rxjs';
import { DEFAULT_MARSHALLERS } from '../../memo.aspect';
import { ObservableMarshaller } from './observable-marshaller';
import { delay } from 'rxjs/operators';

describe('Calling a @Memo method that returns an Observable', () => {
    let joinpoint: jasmine.Spy;
    let memoMethod: () => Observable<any>;

    beforeEach(() => {
        setupMemoAspect();
        joinpoint = jasmine.createSpy('methodSpy').and.callFake((...args: any[]) => of('value').pipe(delay(10)));
        localStorage.clear();
        jasmine.clock().install();
    });
    afterEach(() => {
        jasmine.clock().uninstall();
    });

    describe('when MemoAspect is not configured with the ObservableMarshaller', () => {
        beforeEach(() => {
            memoMethod = createMemoMethod((...args: any[]) => joinpoint(args));
        });

        it('should throw an error', () => {
            expect(memoMethod).toThrow(
                new TypeError(
                    'Type "Observable" is not annotated with "@Cacheable()". Please add "@Cacheable()" on class "Observable", or register a proper MemeMarshaller fot the type.',
                ),
            );
        });
    });

    [LsMemoDriver.NAME, IdbMemoDriver.NAME].forEach((driverName) => {
        describe(`when @Memo is configured with driver "${driverName}"`, () => {
            describe('and MemoAspect is configured with the ObservableMarshaller', () => {
                beforeEach(() => {
                    setupMemoAspect({
                        marshallers: [...DEFAULT_MARSHALLERS, new ObservableMarshaller()],
                    });

                    memoMethod = createMemoMethod((...args: any[]) => joinpoint(args), {
                        driver: driverName,
                    });
                });
                describe('calling the method twice', () => {
                    describe('while the Observable is not completed yet', () => {
                        it('should return an Observable', () => {
                            expect(memoMethod()).toEqual(jasmine.any(Observable));
                            expect(memoMethod()).toEqual(jasmine.any(Observable));
                        });

                        it('should call the real method once', () => {
                            memoMethod();
                            memoMethod();

                            expect(joinpoint).toHaveBeenCalledTimes(1);
                        });
                    });

                    describe('when the Observable is completed', () => {
                        it('should return an Observable', () => {
                            expect(memoMethod()).toEqual(jasmine.any(Observable));
                            expect(memoMethod()).toEqual(jasmine.any(Observable));
                        });

                        it('should call the real method once', () => {
                            memoMethod();

                            jasmine.clock().tick(20);
                            memoMethod();

                            expect(joinpoint).toHaveBeenCalledTimes(1);
                        });
                    });
                });

                describe('when the observable is resolved', () => {
                    it('should resolve to the cached value', async () => {
                        const value1 = await memoMethod().toPromise();
                        const value2 = await memoMethod().toPromise();
                        expect(value1).toEqual('value');
                        expect(value2).toEqual('value');
                    });
                });
            });
        });
    });
});
