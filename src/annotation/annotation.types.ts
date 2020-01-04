export interface AnnotationRef {
    name: string;
    groupId: string;
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
export type Annotation = (ClassAnnotation | MethodAnnotation | ParameterAnnotation | PropertyAnnotation) & Function;

export type AnnotationType = ClassAnnotation | MethodAnnotation | ParameterAnnotation | PropertyAnnotation;
export type DecoratorType = ClassDecorator | MethodDecorator | ParameterDecorator | PropertyDecorator;

export type ClassAnnotation = AnnotationStub<ClassDecorator> & AnnotationRef;
export type MethodAnnotation = AnnotationStub<MethodDecorator> & AnnotationRef;
export type ParameterAnnotation = AnnotationStub<ParameterDecorator> & AnnotationRef;
export type PropertyAnnotation = AnnotationStub<PropertyDecorator> & AnnotationRef;

export type ClassAnnotationStub = AnnotationStub<ClassDecorator>;
export type MethodAnnotationStub = AnnotationStub<MethodDecorator>;
export type PropertyAnnotationStub = AnnotationStub<ParameterDecorator>;
export type ParameterAnnotationStub = AnnotationStub<PropertyDecorator>;
