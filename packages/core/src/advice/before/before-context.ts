import { AnnotationType } from '../../annotation/annotation.types';
import { AnnotationContext } from '../../annotation/context/context';
import { AnnotationTarget } from '../../annotation/target/annotation-target';
import { BeforeAdvice } from '../types';

export interface BeforeContext<T, A extends AnnotationType> {
    /** The annotation context **/
    readonly annotation: AnnotationContext<T, A>;
    /** The 'this' instance bound to the current execution context **/
    readonly instance: A extends AnnotationType.CLASS ? never : T;
    /** the arguments originally passed to the method call **/
    readonly args: any[];
    /** The symbol targeted by this advice (class, method, property or parameter **/
    readonly target: AnnotationTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    readonly data: Record<string, any>;
    /** The list of pending advices for the same phase. Change this list to change all the advices that are going to get applied after the currently applied advice **/
    advices: BeforeAdvice<A>[];
}
