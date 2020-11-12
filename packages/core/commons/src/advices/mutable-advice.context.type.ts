import { AdviceType } from './types';
import { AnnotationContext } from '../annotation/context/annotation.context';
import { JoinPoint } from '../types';
import { AdviceTarget } from '../annotation/target/annotation-target';

/**
 * @public
 */
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
