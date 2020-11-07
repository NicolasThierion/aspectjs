import { assert } from '@aspectjs/core/utils';

export enum AnnotationType { // TODO use binary-mask values
    CLASS = 'AnnotationType.CLASS',
    PROPERTY = 'AnnotationType.PROPERTY',
    METHOD = 'AnnotationType.METHOD',
    PARAMETER = 'AnnotationType.PARAMETER',
}

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

export interface AnnotationStub<T extends Decorator> extends Provider<T> {
    name: string;
}
type Provider<T> = (...args: any[]) => T;

/**
 * An Annotation is an EcmaScript decorator with no behavior.
 * It relies on an aspect weaver configured with proper aspects to get things done.
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

declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
declare type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
declare type MethodDecorator = <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | void;
declare type ParameterDecorator = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

export type Decorator<TFunction extends Function = any, T = any> = (
    target: TFunction | Object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<T> | number,
) => TFunction | void | TypedPropertyDescriptor<T>;

export type ClassAnnotation = AnnotationStub<ClassDecorator> & AnnotationRef;
export type MethodAnnotation = AnnotationStub<MethodDecorator> & AnnotationRef;
export type ParameterAnnotation = AnnotationStub<ParameterDecorator> & AnnotationRef;
export type PropertyAnnotation = AnnotationStub<PropertyDecorator> & AnnotationRef;

export type ClassAnnotationStub = AnnotationStub<ClassDecorator>;
export type MethodAnnotationStub = AnnotationStub<MethodDecorator>;
export type PropertyAnnotationStub = AnnotationStub<PropertyDecorator>;
export type ParameterAnnotationStub = AnnotationStub<ParameterDecorator>;
