import { AroundContext } from '../advice/around/around-context';
import { JoinPoint } from './types';
import { Mutable } from '../utils/utils';
import { isArray } from '../utils/utils';
import { AdviceError } from './errors';
import { AroundAdvice } from '../advice/types';

/**
 * @internal
 */
export class JoinpointFactory<T> {
    // TODO ctxt = AroundContext
    static create<T>(
        advice: AroundAdvice<T>,
        ctxt: Mutable<AroundContext<T>>,
        fn: (...args: any[]) => any,
    ): JoinPoint<T> {
        function alreadyCalledFn(): void {
            throw new AdviceError(advice, `joinPoint already proceeded`);
        }

        return function (args?: unknown[]) {
            args = args ?? ctxt.args;
            if (!isArray(args)) {
                throw new AdviceError(advice, `Joinpoint arguments expected to be array. Got: ${args}`);
            }
            const jp = fn;
            fn = alreadyCalledFn;
            return jp.apply(ctxt.instance, args);
        };
    }
}
