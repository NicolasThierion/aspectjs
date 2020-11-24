import { isArray, Mutable } from '@aspectjs/core/utils';

import { AroundAdvice, AroundContext } from '../advices';
import { JoinPoint } from '../types';
import { AdviceError } from './errors';

/**
 * @internal
 */
export class _JoinpointFactory {
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
