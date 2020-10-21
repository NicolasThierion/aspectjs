import { AnnotationRef, AnnotationType } from '../../annotation/annotation.types';
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
import { getAspectOptions, locator } from '../../utils/utils';
import { AspectOptions } from '../../advice/aspect';
import { weaverContext } from '../weaver-context';
import { PointcutPhase } from '../../advice/pointcut';
import { AnnotationTarget } from '../../annotation/target/annotation-target';
import { AnnotationBundleRegistry } from '../../annotation/bundle/bundle-factory';

export interface AroundAdvicePlan<T = unknown, A extends AnnotationType = any> {
    before: BeforeAdvice<T, A>[];
    around: AroundAdvice<T, A>;
    after: AfterAdvice<T, A>[];
}

export class AdviceExecutionPlanFactory {
    private readonly _aspects: Set<AspectType> = new Set<AspectType>();
    private _dirty = true;
    private _advicesByPointcut: {
        [type in AnnotationType]?: {
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

    create<T, A extends AnnotationType = any>(ctxt: MutableAdviceContext<T, A>): ExecutionPlan<T, A> {
        this._load();

        const compileAdvices: CompileAdvice<T, A>[] = this._getAdvices(PointcutPhase.COMPILE, ctxt.target);
        const beforeAdvices: BeforeAdvice<T, A>[] = this._getAdvices(PointcutPhase.BEFORE, ctxt.target);
        const aroundAdvices: AroundAdvice<T, A>[] = this._getAdvices(PointcutPhase.AROUND, ctxt.target);
        const afterReturnAdvices: AfterReturnAdvice<T, A>[] = this._getAdvices(PointcutPhase.AFTERRETURN, ctxt.target);
        const afterThrowAdvices: AfterThrowAdvice<T, A>[] = this._getAdvices(PointcutPhase.AFTERTHROW, ctxt.target);
        const afterAdvices: AfterAdvice<T, A>[] = this._getAdvices(PointcutPhase.AFTER, ctxt.target);
        const aroundAdvicePlans: AroundAdvicePlan<T, A>[] = [];
        // nest before & after advices into around advices that have higher priority
        while (aroundAdvices.length) {
            const before: BeforeAdvice<T, A>[] = [];
            const after: AfterAdvice<T, A>[] = [];
            const around = aroundAdvices.shift();

            while (
                beforeAdvices.length &&
                around.pointcut.options.priority > beforeAdvices[0].pointcut.options.priority
            ) {
                before.push(beforeAdvices.shift());
            }

            while (
                afterAdvices.length &&
                around.pointcut.options.priority < afterAdvices[0].pointcut.options.priority
            ) {
                after.push(afterAdvices.shift());
            }
            const aroundAdvicePlan: AroundAdvicePlan<T, A> = {
                before,
                after,
                around,
            };
            aroundAdvicePlans.push(aroundAdvicePlan);
        }

        return new ExecutionPlan<T, A>(
            compileAdvices,
            beforeAdvices,
            aroundAdvicePlans,
            afterReturnAdvices,
            afterThrowAdvices,
            afterAdvices,
        );
    }

    disable(...aspects: AspectType[]): void {
        this._dirty = true;
        aspects.forEach((a) => this._aspects.delete(a));
    }

    enable(...aspects: AspectType[]): void {
        this._dirty = true;
        aspects.forEach((a) => this._aspects.add(a));
    }

    private _getAdvices<T, A extends AnnotationType, P extends PointcutPhase>(
        phase: P,
        target: AnnotationTarget<T, A>,
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

export class ExecutionPlan<T = unknown, A extends AnnotationType = any> {
    constructor(
        public readonly compileAdvices: CompileAdvice<T, A>[],
        public readonly beforeAdvices: BeforeAdvice<T, A>[],
        public readonly aroundAdvices: AroundAdvicePlan<T, A>[],
        public readonly afterReturnAdvices: AfterReturnAdvice<T, A>[],
        public readonly afterThrowAdvices: AfterThrowAdvice<T, A>[],
        public readonly afterAdvices: AfterAdvice<T, A>[],
    ) {}
}

function _annotationId(annotation: AnnotationRef): string {
    return `${annotation.groupId}:${annotation.name}`;
}
