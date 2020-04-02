import { AnnotationType } from '../../../annotation/annotation.types';
import { AnnotationContext } from '../../../annotation/context/context';
import { AnnotationTarget } from '../../../annotation/target/annotation-target';
import { JoinPoint } from '../../types';

export interface AroundContext<T, A extends AnnotationType> {
    /** The annotation context **/
    readonly annotation: AnnotationContext<T, A>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance: T;
    /** the arguments originally passed to the method call **/
    readonly args: any[];
    /** The error originally thrown by the method **/
    readonly error: Error;
    /** Hold the original function, bound to its execution context and it original parameters **/
    readonly joinpoint: JoinPoint;
    /** The symbol targeted by this advice (class, method, property or parameter **/
    readonly target: AnnotationTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    readonly data: Record<string, any>;
}
