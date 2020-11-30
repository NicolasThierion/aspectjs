import { AfterReturn, Aspect } from '@aspectjs/core/annotations';
import { AfterReturnContext, AspectType, on, WeaverProfile, WeavingError } from '@aspectjs/core/commons';
import { Memo, MemoAspect } from '@aspectjs/memo';

import { isObservable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { ObservableMarshaller } from './observable-marshaller';

/**
 * Enable support for Observables memoization.
 * @public
 */
@Aspect('@aspectjs/memo:ObservableMemoSupportAspect')
export class ObservableMemoSupportAspect implements AspectType {
    onEnable(weaver: WeaverProfile) {
        const memoAspect = weaver.getAspect(MemoAspect);
        if (!memoAspect) {
            throw new WeavingError(
                `Cannot enable ${ObservableMemoSupportAspect.name}: ${MemoAspect.name} should be enabled first`,
            );
        }
        memoAspect.addMarshaller(new ObservableMarshaller());
    }
    onDisable(weaver: WeaverProfile) {
        weaver.getAspect(MemoAspect)?.removeMarshaller(new ObservableMarshaller());
    }
    @AfterReturn(on.method.withAnnotations(Memo))
    shareReplay(ctxt: AfterReturnContext) {
        if (isObservable(ctxt.value)) {
            return ctxt.value.pipe(shareReplay(1));
        }
        return ctxt.value;
    }
}
