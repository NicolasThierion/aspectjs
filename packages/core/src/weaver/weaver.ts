import { WeaverProfile } from './profile';
import { MutableAdviceContext } from '../advice/advice-context';
import { AdviceType } from '../annotation/annotation.types';

export interface Weaver extends WeaverProfile {
    /**
     * Enable some aspects.
     * @param aspects
     */
    enable(...aspects: any[]): this;
    disable(...aspects: any[]): this;
    reset(): this;

    enhanceClass<T>(ctxt: MutableAdviceContext<T, AdviceType.CLASS>): new () => T;

    enhanceProperty<T>(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>): PropertyDescriptor;

    enhanceMethod<T>(ctxt: MutableAdviceContext<T, AdviceType.METHOD>): PropertyDescriptor;

    enhanceParameter<T>(ctxt: MutableAdviceContext<T, AdviceType.METHOD>): void;
}
