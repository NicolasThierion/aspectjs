/**
 * @public
 */
import { assert } from '@aspectjs/core/utils';

/**
 * @public
 */
export enum AnnotationType { // TODO use binary-mask values
    CLASS = 'AnnotationType.CLASS',
    PROPERTY = 'AnnotationType.PROPERTY',
    METHOD = 'AnnotationType.METHOD',
    PARAMETER = 'AnnotationType.PARAMETER',
}

/**
 * @public
 */
export class AnnotationRef {
    public readonly ref: string;
    public readonly name: string;
    public readonly groupId: string;

    constructor(ref: string);
    constructor(groupId: string, name: string);
    constructor(groupIdOrRef: string, name?: string) {
        if (!name) {
            this.ref = groupIdOrRef;
            const ANNOTATION_REF_REGEX = /(?<groupId>\S+):(?<name>\S+)/;
            const macth = ANNOTATION_REF_REGEX.exec(this.ref);
            this.groupId = macth.groups.groupId;
            this.name = macth.groups.name;
        } else {
            this.ref = `${groupIdOrRef}:${name}`;
            this.name = name;
            this.groupId = groupIdOrRef;
        }
        if (!this.name) {
            assert(false);
            throw new Error('cannot create annotation without name');
        }

        if (!this.groupId) {
            throw new Error('cannot create annotation without groupId');
        }

        Object.defineProperty(this, Symbol.toPrimitive, {
            enumerable: false,
            value: () => {
                return `@${this.name}`;
            },
        });
    }

    toString(): string {
        return `@${this.groupId}:${this.name}`;
    }
}

/**
 * @public
 */
export type AnnotationStub<T extends Decorator> = (
    ...args: any[]
) => T & {
    name: string;
};

/**
 * An Annotation is an EcmaScript decorator with no behavior.
 * It relies on an aspect weaver configured with proper aspects to get things done.
 * @public
 */
export type Annotation<T extends AnnotationType = any> = (T extends AnnotationType.CLASS
    ? ClassAnnotation
    : T extends AnnotationType.METHOD
    ? MethodAnnotation
    : T extends AnnotationType.PARAMETER
    ? ParameterAnnotation
    : T extends AnnotationType.PROPERTY
    ? PropertyAnnotation
    : never) & // eslint-disable-next-line @typescript-eslint/ban-types
    Function &
    AnnotationRef;

/**
 * @public
 */
export type Decorator<TFunction extends Function = any, T = any> = (
    target: TFunction | Object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<T> | number,
) => TFunction | void | TypedPropertyDescriptor<T>;

/**
 * @public
 */
export type ClassAnnotation = AnnotationStub<ClassDecorator> & AnnotationRef;
/**
 * @public
 */
export type MethodAnnotation = AnnotationStub<MethodDecorator> & AnnotationRef;
/**
 * @public
 */
export type ParameterAnnotation = AnnotationStub<ParameterDecorator> & AnnotationRef;
/**
 * @public
 */
export type PropertyAnnotation = AnnotationStub<PropertyDecorator> & AnnotationRef;

/**
 * @public
 */
export type ClassAnnotationStub = AnnotationStub<ClassDecorator>;
/**
 * @public
 */
export type MethodAnnotationStub = AnnotationStub<MethodDecorator>;
/**
 * @public
 */
export type PropertyAnnotationStub = AnnotationStub<PropertyDecorator>;
/**
 * @public
 */
export type ParameterAnnotationStub = AnnotationStub<ParameterDecorator>;
