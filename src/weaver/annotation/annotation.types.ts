export interface AnnotationRef {
    name: string;
    groupId: string;
}
/**
 * An Annotation is an EcmaScript decorator with no behavior.
 * It relies on an annotation compiler with annotation processors to get the things done.
 */
export type AnnotationStub<T extends AnnotationType> = T extends ClassAnnotation
    ? ClassAnnotationStub
    : T extends PropertyAnnotation
    ? PropertyAnnotationStub
    : T extends MethodAnnotation
    ? MethodAnnotationStub
    : T extends ParameterAnnotation
    ? ParameterAnnotationStub
    : never;
export type ClassAnnotationStub = { name: string } & ((...args: any[]) => ClassAnnotation);
export type PropertyAnnotationStub = { name: string } & ((...args: any[]) => PropertyAnnotation);
export type MethodAnnotationStub = { name: string } & ((...args: any[]) => MethodAnnotation);
export type ParameterAnnotationStub = { name: string } & ((...args: any[]) => ParameterAnnotation);

/**
 * An Annotation is an EcmaScript decorator with no behavior.
 * It relies on an annotation compiler with annotation processors to get the things done.
 */
export type Annotation = AnnotationStub<AnnotationType> & AnnotationRef;

export type AnnotationType = ClassAnnotation | MethodAnnotation | ParameterAnnotation | PropertyAnnotation;

export type ClassAnnotation = ClassDecorator;
export type MethodAnnotation = MethodDecorator;
export type ParameterAnnotation = ParameterDecorator;
export type PropertyAnnotation = PropertyDecorator;
