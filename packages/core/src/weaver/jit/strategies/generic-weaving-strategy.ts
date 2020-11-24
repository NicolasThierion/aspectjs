import {
    _JoinpointFactory,
    Advice,
    AdviceContext,
    AdviceError,
    AdviceType,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AfterThrowContext,
    AnnotationType,
    AroundAdvice,
    BeforeAdvice,
    CompileAdvice,
    JoinPoint,
    MutableAdviceContext,
} from '@aspectjs/core/commons';
import { assert, isUndefined } from '@aspectjs/core/utils';
import { _WeavingStrategy } from '../../weaving-strategy';

/**
 * @internal
 */
export abstract class _GenericWeavingStrategy<T, A extends AdviceType> implements _WeavingStrategy<T, A> {
    after(ctxt: MutableAdviceContext<T, A>, advices: AfterAdvice<T, A>[]): void {
        this._applyNonReturningAdvices(ctxt, advices);
    }

    afterReturn(ctxt: MutableAdviceContext<T, A>, advices: AfterReturnAdvice<T, A>[]): T {
        ctxt.value = ctxt.value; // force key 'value' to be present

        advices.forEach((advice) => {
            ctxt.value = advice(ctxt, ctxt.value);
        });

        return ctxt.value as T;
    }

    afterThrow(ctxt: MutableAdviceContext<T, A>, advices: AfterThrowAdvice<T, A>[], allowReturn = true): any {
        if (advices.length) {
            ctxt.value = ctxt.value ?? undefined; // force key 'value' to be present
            advices.forEach((advice: AfterThrowAdvice) => {
                ctxt.advice = advice as any;
                ctxt.value = advice(ctxt as AfterThrowContext<any, AdviceType>, ctxt.error);
                delete ctxt.advice;
                if (!allowReturn && !isUndefined(ctxt.value)) {
                    throw new AdviceError(advice, `Returning from advice is not supported`);
                }
            });
            return ctxt.value;
        } else {
            assert(!!ctxt.error);
            // pass-trough errors by default
            throw ctxt.error;
        }
    }

    around(
        ctxt: MutableAdviceContext<T, A>,
        advices: AroundAdvice<T, A>[],
        jp: JoinPoint<T>,
        allowReturn = true,
    ): JoinPoint<T> {
        advices.reverse().forEach((advice) => {
            const originalJp = jp;
            const nextJp = _JoinpointFactory.create(advice, ctxt, (...args: unknown[]) => originalJp(args));
            jp = (args: any[]) => {
                ctxt.joinpoint = nextJp;
                ctxt.args = args;
                ctxt.advice = advice;
                ctxt.value = advice(ctxt as any, nextJp, args);
                if (ctxt.value !== undefined && !allowReturn) {
                    throw new AdviceError(advice, `Returning from advice is not supported`);
                }
                return ctxt.value as T;
            };
        });

        return jp;
    }

    before(ctxt: MutableAdviceContext<T, A>, advices: BeforeAdvice<T, A>[]): void {
        this._applyNonReturningAdvices(ctxt, advices);
    }

    abstract compile(
        ctxt: MutableAdviceContext<T, A>,
        advices: CompileAdvice<T, AdviceType>[],
    ): A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;

    abstract initialJoinpoint(
        ctxt: MutableAdviceContext<T, A>,
        originalSymbol: A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor,
    ): void;

    abstract finalize(
        ctxt: MutableAdviceContext<T, A>,
        joinpoint: (...args: any[]) => T,
    ): A extends AnnotationType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;

    protected _applyNonReturningAdvices(ctxt: MutableAdviceContext<any>, advices: Advice[]) {
        advices.forEach((advice: AfterAdvice) => {
            ctxt.advice = advice;
            const retVal = advice(ctxt as AdviceContext);
            delete ctxt.advice;
            if (!isUndefined(retVal)) {
                throw new AdviceError(advice, `Returning from advice is not supported`);
            }
        });
    }
}
