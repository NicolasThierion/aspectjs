import { AnnotationRef, AdviceType } from '../../annotation/annotation.types';
import { MutableAdviceContext } from '../../advice/advice-context';
import {
    Advice,
    AfterAdvice,
    AfterReturnAdvice,
    AfterThrowAdvice,
    AroundAdvice,
    BeforeAdvice,
    CompileAdvice,
} from '../../advice/types';
import { AspectType } from '../types';
import { getAspectOptions } from '../../utils/utils';
import { AspectOptions } from '../../advice/aspect';
import { weaverContext } from '../weaver-context';
import { PointcutPhase } from '../../advice/pointcut';
import { AdviceTarget } from '../../advice/target/advice-target';
import { AnnotationBundleRegistry } from '../../annotation/bundle/bundle-factory';
import { WeaverHooks } from '../weaver-hooks';
import { JoinpointFactory } from '../joinpoint-factory';
import { WeavingError } from '../errors/weaving-error';
import { locator } from '../../utils/locator';
import { assert } from '@aspectjs/core/utils';

export class AdviceExecutionPlanFactory {
    private readonly _aspects: Set<AspectType> = new Set<AspectType>();
    private _dirty = true;
    private _advicesByPointcut: {
        [type in AdviceType]?: {
            [phase in PointcutPhase]?: {
                byAnnotation: {
                    [annotationRef: string]: Advice<unknown, type, phase>[];
                };
            };
        };
    };
    private _advicesByTarget: {
        [targetRef: string]: Advice[];
    };

    constructor(...aspects: AspectType[]) {
        this.enable(...aspects);
    }

    create<T, A extends AdviceType = any>(
        target: AdviceTarget<T, A>,
        filter?: (a: Advice) => boolean,
    ): ExecutionPlan<T, A> {
        this._load();

        if (filter) {
            return new ExecutionPlan<T, A>(
                this._getAdvices(PointcutPhase.COMPILE, target).filter(filter),
                this._getAdvices(PointcutPhase.BEFORE, target).filter(filter),
                this._getAdvices(PointcutPhase.AROUND, target).filter(filter),
                this._getAdvices(PointcutPhase.AFTERRETURN, target).filter(filter),
                this._getAdvices(PointcutPhase.AFTERTHROW, target).filter(filter),
                this._getAdvices(PointcutPhase.AFTER, target).filter(filter),
            );
        } else {
            return new ExecutionPlan<T, A>(
                this._getAdvices(PointcutPhase.COMPILE, target),
                this._getAdvices(PointcutPhase.BEFORE, target),
                this._getAdvices(PointcutPhase.AROUND, target),
                this._getAdvices(PointcutPhase.AFTERRETURN, target),
                this._getAdvices(PointcutPhase.AFTERTHROW, target),
                this._getAdvices(PointcutPhase.AFTER, target),
            );
        }
    }

    disable(...aspects: AspectType[]): void {
        this._dirty = true;
        aspects.forEach((a) => this._aspects.delete(a));
    }

    enable(...aspects: AspectType[]): void {
        this._dirty = true;
        aspects.forEach((a) => this._aspects.add(a));
    }

    private _getAdvices<T, A extends AdviceType, P extends PointcutPhase>(
        phase: P,
        target: AdviceTarget<T, A>,
    ): Advice<T, A, P>[] {
        this._load();

        return [
            ...locator(this._advicesByTarget)
                .at(target.ref)
                .orElse(() => {
                    // get all advices that correspond to all the annotations of this context
                    const bundle = AnnotationBundleRegistry.of(target).at(target.location);
                    const annotationContexts = bundle.all();

                    return annotationContexts
                        .map((annotationContext) =>
                            locator(this._advicesByPointcut)
                                .at(target.type)
                                .at(phase)
                                .at('byAnnotation')
                                .at(_annotationId(annotationContext))
                                .orElse(() => [] as any),
                        )
                        .flat()
                        .sort((a1: Advice, a2: Advice) => {
                            const [p1, p2] = [a1.pointcut.options.priority, a2.pointcut.options.priority];
                            return !p2 && !p2 ? 0 : p2 - p1;
                        });
                }),
        ] as Advice<T, A, P>[];
    }

    /**
     * Sort the aspects according to their precedence & store by phase & type
     * @private
     */
    private _load() {
        if (this._dirty) {
            this._advicesByTarget = {};
            this._advicesByPointcut = {};

            [...this._aspects]
                .sort((a1: any, a2: any) => {
                    // sort by aspect priority
                    const [o1, o2] = [getAspectOptions(a1), getAspectOptions(a2)] as AspectOptions[];
                    const [p1, p2] = [o1?.priority ?? 0, o2?.priority ?? 0];

                    return p2 - p1;
                })
                .map((aspect: AspectType) => weaverContext.advicesRegistry.getAdvicesByAspect(aspect))
                .map((advices: Advice[]) => {
                    advices.forEach((advice) => {
                        const pc = advice.pointcut;
                        locator(this._advicesByPointcut)
                            .at(pc.type)
                            .at(pc.phase)
                            .at('byAnnotation')
                            .at(_annotationId(pc.annotation))
                            .orElse(() => [])
                            .push(advice);
                    });
                });
        }
    }
}

/**
 * Sort the advices according to their precedence & store by phase & type, so they are ready to execute.
 */
export class ExecutionPlan<T = unknown, A extends AdviceType = any> {
    constructor(
        public readonly compileAdvices: CompileAdvice<T, A>[],
        public readonly beforeAdvices: BeforeAdvice<T, A>[],
        public readonly aroundAdvices: AroundAdvice<T, A>[],
        public readonly afterReturnAdvices: AfterReturnAdvice<T, A>[],
        public readonly afterThrowAdvices: AfterThrowAdvice<T, A>[],
        public readonly afterAdvices: AfterAdvice<T, A>[],
    ) {}

    /**
     * Executes the advices of the plan in proper order, calling the provided hooks.
     * /!\ DO NOT EXECUTES COMPILE ADVICES
     * // TODO handle compile advices as well.
     */
    execute<C extends MutableAdviceContext<T, A>>(ctxt: C, hooks: WeaverHooks<T, A>): (...args: any[]) => T {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const plan = this;
        const originalSymbol = hooks.compile(ctxt);
        assert(!!originalSymbol);

        return function (...args: any[]): T {
            ctxt.args = args;
            ctxt.instance = this;

            // create the joinpoint for the original method
            const jp = JoinpointFactory.create(ctxt, (...args: any[]) => {
                const restoreJp = ctxt.joinpoint;
                const restoreArgs = ctxt.args;
                ctxt.args = args;
                delete ctxt.joinpoint;

                try {
                    hooks.preBefore?.call(hooks, ctxt);
                    hooks.before(ctxt, plan.beforeAdvices);

                    hooks.initialJoinpoint.call(hooks, ctxt, originalSymbol);

                    hooks.preAfterReturn?.call(hooks, ctxt);
                    return hooks.afterReturn(ctxt, plan.afterReturnAdvices);
                } catch (e) {
                    // consider WeavingErrors as not recoverable by an aspect
                    if (e instanceof WeavingError) {
                        throw e;
                    }
                    ctxt.error = e;

                    hooks.preAfterThrow?.call(hooks, ctxt);
                    return hooks.afterThrow(ctxt, plan.afterThrowAdvices);
                } finally {
                    delete ctxt.error;
                    hooks.preAfter?.call(hooks, ctxt);
                    hooks.after(ctxt, plan.afterAdvices);
                    ctxt.joinpoint = restoreJp;
                    ctxt.args = restoreArgs;
                }
            });

            hooks.preAround?.call(hooks, ctxt);
            return hooks.around(ctxt, plan.aroundAdvices, jp)(args);
        };
    }
}

function _annotationId(annotation: AnnotationRef): string {
    return `${annotation.groupId}:${annotation.name}`;
}
