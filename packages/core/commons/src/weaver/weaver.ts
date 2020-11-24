import { AnnotationType } from '../annotation/annotation.types';
import { AnnotationTarget } from '../annotation/target/annotation-target';
import { AspectType } from '../aspect';
import { WeaverProfile } from './profile';

/**
 * A Weaver is some sort of processor that invoke the advices according to the enabled aspects
 * @public
 */
export interface Weaver extends WeaverProfile {
    /**
     * Enable some aspects.
     * @param aspects - the aspects to enable
     */
    enable(...aspects: AspectType[]): this;

    /**
     * Disable some aspects.
     * @param aspects - the aspects to disable
     */
    disable(...aspects: (AspectType | string)[]): this;

    /**
     * Disable all aspects.
     */
    reset(): this;

    enhance<T>(target: AnnotationTarget<T, AnnotationType>): Function | PropertyDescriptor | void;
}
