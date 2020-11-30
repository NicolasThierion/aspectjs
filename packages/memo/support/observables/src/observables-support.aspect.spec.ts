import { setupTestingWeaverContext } from '@aspectjs/core/testing';
import { Observable, of } from 'rxjs';
import { Memo, MEMO_PROFILE } from '@aspectjs/memo';
import { setupMemoAspect } from '../../../src/utils/spec-helpers';
import { ObservableMemoSupportAspect } from './observables-support.aspect';

describe('ObservableMemoSupportAspect', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    describe('when not enabled', () => {
        beforeEach(() => {
            setupMemoAspect();
        });
        it('should throw an error when using @Memo() with an observable', () => {
            class Producer {
                @Memo()
                getObservable() {
                    return of('value');
                }
            }

            expect(() => new Producer().getObservable()).toThrow(
                new TypeError(
                    'Type "Observable" is not annotated with "@Cacheable". Please add "@Cacheable" on class "Observable", or register a proper MemoMarshaller for this type.',
                ),
            );
        });
    });

    describe('when enabled', () => {
        beforeEach(() => {
            setupTestingWeaverContext();
            MEMO_PROFILE.enable(new ObservableMemoSupportAspect()).register();
        });
        it('should allow using @Memo with an observable', async (cb) => {
            const spy = jasmine.createSpy('getObservable').and.callFake(() => of('value'));
            class Producer {
                @Memo()
                getObservable(): Observable<any> {
                    return spy();
                }
            }

            const p = new Producer();

            let value = await p.getObservable().toPromise();
            expect(value).toEqual('value');
            value = await p.getObservable().toPromise();
            expect(value).toEqual('value');
            expect(spy).toHaveBeenCalledTimes(1);
            cb();
        });
    });
});
