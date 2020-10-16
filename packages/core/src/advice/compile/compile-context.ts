import { AnnotationType } from '../../annotation/annotation.types';
import { AnnotationContext } from '../../annotation/context/context';
import { AnnotationTarget } from '../../annotation/target/annotation-target';
import { CompileAdvice } from '../types';

export interface CompileContext<T = unknown, A extends AnnotationType = any> {
    /** The annotation context **/
    readonly annotation: AnnotationContext<T, A>;
    /** The symbol targeted by this advice (class, method, property or parameter **/
    readonly target: AnnotationTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    readonly data: Record<string, any>;
    /** The list of pending advices for the same phase. Change this list to change all the advices that are going to get applied after the currently applied advice **/
    advices: CompileAdvice<T, A>[];
}
