import { WeaverProfile } from './profile';
import { MutableAdviceContext } from '../advice/advice-context';
import { AnnotationType } from '../annotation/annotation.types';

export interface Weaver extends WeaverProfile {
    /**
     * Enable some aspects.
     * @param aspects
     */
    enable(...aspects: any[]): this;
    disable(...aspects: any[]): this;
    reset(): this;

    enhanceClass<T>(ctxt: MutableAdviceContext<T, AnnotationType.CLASS>): new () => T;

    enhanceProperty<T>(ctxt: MutableAdviceContext<T, AnnotationType.PROPERTY>): PropertyDescriptor;

    enhanceMethod<T>(ctxt: MutableAdviceContext<T, AnnotationType.METHOD>): PropertyDescriptor;

    enhanceParameter<T>(ctxt: MutableAdviceContext<T, AnnotationType.METHOD>): void;
}
