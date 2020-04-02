import { AnnotationType } from '../../../annotation/annotation.types';
import { AnnotationContext } from '../../../annotation/context/context';
import { AnnotationTarget } from '../../../annotation/target/annotation-target';

export interface AfterThrowContext<T, A extends AnnotationType> {
    /** The annotation context **/
    readonly annotation: AnnotationContext<T, A>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance: T;
    /** the arguments originally passed to the method call **/
    readonly args: any[];
    /** The error originally thrown by the method **/
    readonly error: Error;
    /** The value originally returned by the method **/
    readonly value: any;
    /** The symbol targeted by this advice (class, method, property or parameter **/
    readonly target: AnnotationTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    readonly data: Record<string, any>;
}
