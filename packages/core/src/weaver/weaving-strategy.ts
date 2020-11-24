import {
    AdviceType,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AroundAdvice,
    BeforeAdvice,
    CompileAdvice,
    MutableAdviceContext,
    JoinPoint,
} from '@aspectjs/core/commons';

/**
 * @internal
 */
export interface _WeavingStrategy<T, A extends AdviceType> {
    compile(
        ctxt: MutableAdviceContext<T, A>,
        advice: CompileAdvice<T, A>[],
    ): A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;

    preBefore?(ctxt: MutableAdviceContext<T, A>): void;
    before(ctxt: MutableAdviceContext<T, A>, beforeAdvices: BeforeAdvice<T, A>[]): void;

    initialJoinpoint(
        ctxt: MutableAdviceContext<T, A>,
        originalSymbol: A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor,
    ): void;

    preAfterReturn?(ctxt: MutableAdviceContext<T, A>): void;
    afterReturn(ctxt: MutableAdviceContext<T, A>, afterReturnAdvices: AfterReturnAdvice<T, A>[]): T;

    preAfterThrow?(ctxt: MutableAdviceContext<T, A>): void;
    afterThrow(ctxt: MutableAdviceContext<T, A>, afterThrowAdvices: AfterThrowAdvice<T, A>[]): T;

    preAfter?(ctxt: MutableAdviceContext<T, A>): void;
    after(ctxt: MutableAdviceContext<T, A>, afterAdvices: AfterAdvice<T, A>[]): void;

    preAround?(ctxt: MutableAdviceContext<T, A>): void;
    around(
        ctxt: MutableAdviceContext<T, A>,
        aroundAdvices: AroundAdvice<T, A>[],
        jp: (args?: any[]) => T,
    ): JoinPoint<T>;
    finalize(
        ctxt: MutableAdviceContext<T, A>,
        joinpoint: (...args: any[]) => T,
    ): A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;
}
