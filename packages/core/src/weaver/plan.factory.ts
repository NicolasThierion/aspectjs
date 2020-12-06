import {
    _getWeaverContext,
    _JoinpointFactory,
    Advice,
    AdviceTarget,
    AdviceType,
    CompileAdvice,
    MutableAdviceContext,
    PointcutPhase,
    WeaverContext,
    WeavingError,
} from '@aspectjs/core/commons';
import { assert } from '@aspectjs/core/utils';
import { _WeavingStrategy } from './weaving-strategy';

/**
 * @internal
 */
export class _AdviceExecutionPlanFactory {
    create<T, A extends AdviceType = any>(
        target: AdviceTarget<T, A>,
        hooks: _WeavingStrategy<T, A>,
        filter?: {
            name: string;
            fn: (a: Advice) => boolean;
        },
    ): _ExecutionPlan<T, A> {
        let compiled = false;
        let compiledSymbol: A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;

        const linkFn = (ctxt: MutableAdviceContext<T, A>) => {
            if (!compiled) {
                compileFn(ctxt);
            }
            assert(!!compiledSymbol);

            const jp = function (...args: any[]): T {
                ctxt.args = args;
                ctxt.instance = this;
                const advicesReg = _getWeaverContext().aspects.registry.getAdvicesByTarget(
                    ctxt.target,
                    filter,
                    PointcutPhase.BEFORE,
                    PointcutPhase.AROUND,
                    PointcutPhase.AFTERRETURN,
                    PointcutPhase.AFTERTHROW,
                    PointcutPhase.AFTER,
                );

                // create the joinpoint for the original method
                const jp = _JoinpointFactory.create(null, ctxt, (...args: any[]) => {
                    const restoreJp = ctxt.joinpoint;
                    const restoreArgs = ctxt.args;
                    ctxt.args = args;
                    delete ctxt.joinpoint;

                    try {
                        hooks.preBefore?.call(hooks, ctxt);
                        hooks.before(ctxt, advicesReg[PointcutPhase.BEFORE] as Advice<T, A, PointcutPhase.BEFORE>[]);

                        hooks.initialJoinpoint.call(hooks, ctxt, compiledSymbol);

                        hooks.preAfterReturn?.call(hooks, ctxt);
                        return hooks.afterReturn(
                            ctxt,
                            advicesReg[PointcutPhase.AFTERRETURN] as Advice<T, A, PointcutPhase.AFTERRETURN>[],
                        );
                    } catch (e) {
                        // consider WeavingErrors as not recoverable by an aspect
                        if (e instanceof WeavingError) {
                            throw e;
                        }
                        ctxt.error = e;

                        hooks.preAfterThrow?.call(hooks, ctxt);
                        return hooks.afterThrow(
                            ctxt,
                            advicesReg[PointcutPhase.AFTERTHROW] as Advice<T, A, PointcutPhase.AFTERTHROW>[],
                        );
                    } finally {
                        delete ctxt.error;
                        hooks.preAfter?.call(hooks, ctxt);
                        hooks.after(ctxt, advicesReg[PointcutPhase.AFTER] as Advice<T, A, PointcutPhase.AFTER>[]);
                        ctxt.joinpoint = restoreJp;
                        ctxt.args = restoreArgs;
                    }
                });

                hooks.preAround?.call(hooks, ctxt);
                return hooks.around(
                    ctxt,
                    advicesReg[PointcutPhase.AROUND] as Advice<T, A, PointcutPhase.AROUND>[],
                    jp,
                )(args);
            };

            return hooks.finalize.call(hooks, ctxt, jp) ?? jp;
        };
        const compileFn = (ctxt: MutableAdviceContext<T, A>) => {
            const compileAdvices = _getWeaverContext().aspects.registry.getAdvicesByTarget(
                ctxt.target,
                filter,
                PointcutPhase.COMPILE,
            )[PointcutPhase.COMPILE];
            compiledSymbol = hooks.compile(ctxt, compileAdvices as CompileAdvice<T, A>[]);
            compiled = true;
            if (!compiledSymbol) {
                throw new WeavingError(
                    `${Reflect.getPrototypeOf(hooks).constructor.name}.compile() did not returned a symbol`,
                );
            }
            return compiledSymbol;
        };
        return new _ExecutionPlan<T, A>(compileFn, linkFn);
    }
}

type WeaverCompile<T = unknown, A extends AdviceType = any> = (
    ctxt: MutableAdviceContext<T, A>,
) => A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;

type WeaverLink<T = unknown, A extends AdviceType = any> = (
    ctxt: MutableAdviceContext<T, A>,
    initialSymbol: A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor,
) => A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;
/**
 * Sort the advices according to their precedence & store by phase & type, so they are ready to execute.
 * @internal
 */
export class _ExecutionPlan<T = unknown, A extends AdviceType = any> {
    constructor(private compileFn: WeaverCompile<T, A>, private linkFn: WeaverLink<T, A>) {}

    compile<C extends MutableAdviceContext<T, A>>(
        ctxt: C,
    ): {
        link: () => A extends AdviceType.CLASS ? { new (...args: any[]): T } : PropertyDescriptor;
    } {
        const compiled = this.compileFn(ctxt);
        const link = this.linkFn;
        return {
            /**
             * Returns a function that executes the plan for the Before, Around, AfterReturn, AfterThrow & After advices.
             */
            link: () => link(ctxt, compiled),
        };
    }
}
