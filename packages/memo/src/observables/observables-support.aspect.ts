import { AfterReturn, Aspect } from '@aspectjs/core/annotations';
import { AfterReturnContext, on } from '@aspectjs/core/commons';
import { isObservable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Memo } from '../memo.annotation';

/**
 * Enable support for Observables memoization.
 * @public
 */
@Aspect('@aspectjs/memo:ObservableMemoSupportAspect')
export class ObservableMemoSupportAspect {
    @AfterReturn(on.method.withAnnotations(Memo))
    shareReplay(ctxt: AfterReturnContext) {
        if (isObservable(ctxt.value)) {
            return ctxt.value.pipe(shareReplay(1));
        }
        return ctxt.value;
    }
}
