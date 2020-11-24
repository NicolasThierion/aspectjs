import { _setWeaverContext, AnnotationFactory, AnnotationRef, AspectType, WeaverContext } from '@aspectjs/core/commons';
import { TestingWeaverContext } from './testing-weaver-context.impl';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;

/**
 * Dummy object interface used for test purpose
 * @public
 */
export interface Labeled {
    labels?: string[];
    addLabel?: (...args: any[]) => any;
}

/**
 * Setup a brand new WEAVER_CONTEXT for test purposes
 * @public
 */
export function setupTestingWeaverContext(...aspects: AspectType[]): WeaverContext {
    const context = new TestingWeaverContext();
    _setWeaverContext(context);
    const weaver = context.getWeaver();
    weaver.enable(...aspects);
    return context;
}

/**
 * Dummy annotation useful for tests
 * @public
 */
export const AClass = new AnnotationFactory('tests').create(function AClass(): ClassDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const BClass = new AnnotationFactory('tests').create(function BClass(): ClassDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const CClass = new AnnotationFactory('tests').create(function CClass(): ClassDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const DClass = new AnnotationFactory('tests').create(function DClass(): ClassDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const XClass = new AnnotationFactory('tests').create(function XClass(): ClassDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const BProperty = new AnnotationFactory('tests').create(function BProperty(): PropertyDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const CProperty = new AnnotationFactory('tests').create(function CProperty(): PropertyDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const DProperty = new AnnotationFactory('tests').create(function DProperty(): PropertyDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const XProperty = new AnnotationFactory('tests').create(function XProperty(): PropertyDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const AMethod = new AnnotationFactory('tests').create(function AMethod(): MethodDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const BMethod = new AnnotationFactory('tests').create(function BMethod(): MethodDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const CMethod = new AnnotationFactory('tests').create(function CMethod(): MethodDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const DMethod = new AnnotationFactory('tests').create(function DMethod(): MethodDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const XMethod = new AnnotationFactory('tests').create(function XMethod(): MethodDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const AParameter = new AnnotationFactory('tests').create(function AParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const BParameter = new AnnotationFactory('tests').create(function BParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const CParameter = new AnnotationFactory('tests').create(function CParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const DParameter = new AnnotationFactory('tests').create(function DParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

/**
 * Dummy annotation useful for tests
 * @public
 */
export const XParameter = new AnnotationFactory('tests').create(function XParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});
