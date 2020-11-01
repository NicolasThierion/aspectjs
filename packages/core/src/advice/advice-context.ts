import { AnnotationContext } from '../annotation/context/annotation-context';
import { AdviceTarget } from '../annotation/target/annotation-target';
import { JoinPoint } from '../weaver/types';
import { AfterContext } from './after/after-context';
import { BeforeContext } from './before/before-context';
import { AfterReturnContext } from './after-return/after-return-context';
import { AfterThrowContext } from './after-throw/after-throw-context';
import { AroundContext } from './around/around-context';
import { CompileContext } from './compile/compile-context';
import { AdviceType } from './types';

/**
 * @public
 */
export type AdviceContext<T = unknown, A extends AdviceType = any> =
    | AfterContext<T, A>
    | BeforeContext<T, A>
    | AfterReturnContext<T, A>
    | AfterThrowContext<T, A>
    | AroundContext<T, A>
    | CompileContext<T, A>;

// export type AdviceContext<
//     P extends PointcutPhase,
//     T = unknown,
//     A extends AdviceType = any
//     > = P extends PointcutPhase.AFTER
//     ? AfterContext<T, A>
//     : P extends PointcutPhase.AFTERRETURN
//         ? AfterReturnContext<T, A>
//         : P extends PointcutPhase.AFTERTHROW
//             ? AfterThrowContext<T, A>
//             : P extends PointcutPhase.AROUND
//                 ? AroundContext<T, A>
//                 : P extends PointcutPhase.COMPILE
//                     ? CompileContext<T, A>
//                     : never;

export interface MutableAdviceContext<T = unknown, A extends AdviceType = any> {
    annotation: AnnotationContext<T, A>;
    instance: T;
    value: unknown;
    args: unknown[];
    error: Error;
    joinpoint: JoinPoint;
    target: AdviceTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    data: Record<string, any>;

    clone(): this;
}

export { AfterContext, BeforeContext, AfterReturnContext, AfterThrowContext, AroundContext, CompileContext };
