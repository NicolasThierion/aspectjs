export enum AdviceType {
    CLASS = 'AdviceType.CLASS',
    PROPERTY = 'AdviceType.PROPERTY',
    METHOD = 'AdviceType.METHOD',
    PARAMETER = 'AdviceType.PARAMETER',
}

export interface AnnotationRef {
    name: string;
    groupId: string;
    toString(): string;
}

export namespace AnnotationRef {
    export function of(name: string, groupId?: string): AnnotationRef {
        const annotation = {
            name,
            groupId,
        } as AnnotationRef;
        if (!groupId) {
            const ref = name;
            const ANNOTATION_REF_REGEX = /(?<groupId>\S+):(?<name>\S+)/;
            const macth = ANNOTATION_REF_REGEX.exec(ref);
            annotation.groupId = macth.groups.groupId;
            annotation.name = macth.groups.name;
        }

        Reflect.defineProperty(annotation, 'toString', {
            enumerable: false,
            value: function () {
                return `@${annotation.groupId}:${annotation.name}`;
            },
        });

        Reflect.defineProperty(annotation, Symbol.toPrimitive, {
            enumerable: false,
            value: function () {
                return `@${annotation.name}`;
            },
        });

        return annotation;
    }
}
/**
 * An Annotation is an EcmaScript decorator with no behavior.
 * It relies on an annotation compiler with annotation processors to get the things done.
 */
export interface AnnotationStub<T extends DecoratorType> extends Provider<T> {
    name: string;
}
type Provider<T> = (...args: any[]) => T;

/**
 * An Annotation is an EcmaScript decorator with no behavior.
 * It relies on an annotation compiler with annotation processors to get the things done.
 */
export type Annotation<T extends AdviceType = any> = (T extends AdviceType.CLASS
    ? ClassAnnotation
    : T extends AdviceType.METHOD
    ? MethodAnnotation
    : T extends AdviceType.PARAMETER
    ? ParameterAnnotation
    : T extends AdviceType.PROPERTY
    ? PropertyAnnotation
    : never) & // eslint-disable-next-line @typescript-eslint/ban-types
    Function &
    AnnotationRef;

type DecoratorType = ClassDecorator | MethodDecorator | ParameterDecorator | PropertyDecorator;

export type ClassAnnotation = AnnotationStub<ClassDecorator> & AnnotationRef;
export type MethodAnnotation = AnnotationStub<MethodDecorator> & AnnotationRef;
export type ParameterAnnotation = AnnotationStub<ParameterDecorator> & AnnotationRef;
export type PropertyAnnotation = AnnotationStub<PropertyDecorator> & AnnotationRef;

export type ClassAnnotationStub = AnnotationStub<ClassDecorator>;
export type MethodAnnotationStub = AnnotationStub<MethodDecorator>;
export type PropertyAnnotationStub = AnnotationStub<PropertyDecorator>;
export type ParameterAnnotationStub = AnnotationStub<ParameterDecorator>;
