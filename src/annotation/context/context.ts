import {
    AnnotationTarget,
    ClassAnnotationTarget,
    MethodAnnotationTarget,
    PropertyAnnotationTarget,
} from '../target/annotation-target';
import { AnnotationBundleFactory, AnnotationsBundleImpl } from '../bundle/bundle-factory';
import {
    AnnotationRef,
    AnnotationType,
    ClassAnnotation,
    MethodAnnotation,
    ParameterAnnotation,
    PropertyAnnotation,
} from '../annotation.types';

export interface AnnotationContext<T, D extends AnnotationType> {
    readonly args?: any[];
    readonly target: AnnotationTarget<T, D>;
    readonly instance: T;
    readonly annotation: AnnotationRef;
    bindValue(value: any): this;
    getValue(): any;
}

export interface ClassAnnotationContext<T> extends AnnotationContext<T, ClassAnnotation> {
    readonly target: ClassAnnotationTarget<T>;
}

export interface MethodAnnotationContext<T> extends AnnotationContext<T, MethodAnnotation> {
    readonly target: MethodAnnotationTarget<T>;
}

export interface PropertyAnnotationContext<T> extends AnnotationContext<T, PropertyAnnotation> {
    readonly target: PropertyAnnotationTarget<T>;
}

export interface ParameterAnnotationContext<T> extends AnnotationContext<T, ParameterAnnotation> {
    readonly target: AnnotationTarget<T, ParameterAnnotation>;
}

// TODO move
export class AnnotationContextImpl<T, D extends AnnotationType> implements AnnotationContext<T, D> {
    readonly args?: any[];
    private _value: any;
    private _resolved = false;

    constructor(
        public readonly target: AnnotationTarget<T, D>,
        public readonly instance: T,
        public readonly annotation: AnnotationRef,
        args?: any[],
    ) {
        this.args = args;
    }

    toString(): string {
        return `@${this.annotation.name}`;
    }

    bindValue(value: any): this {
        this._value = value;
        this._resolved = true;
        return this;
    }

    getValue() {
        if (!this._resolved) {
            throw new Error(`${this} value has not been bound`);
        }

        return this._value;
    }

    get bundle() {
        // check allowMultiple is honored
        return AnnotationBundleFactory.of(this.target) as AnnotationsBundleImpl<any>;
    }
}
