import { AspectType } from '../../src/weaver';
import { AnnotationFactory } from '../../src/annotation/factory/annotation-factory';
import { setWeaverContext } from '../../src/weaver';
import { WeaverContextImpl } from '../../src/weaver/weaver-context.impl';

export interface Labeled {
    labels?: string[];
    addLabel?: (...args: any[]) => any;
}
export function resetWeaverContext(...aspects: AspectType[]) {
    const context = new WeaverContextImpl();
    setWeaverContext(context);
    const weaver = context.getWeaver();
    weaver.enable(...aspects);
    return context;
}

export const AClass = new AnnotationFactory('tests').create(function AClass(): ClassDecorator {
    return;
});

export const BClass = new AnnotationFactory('tests').create(function BClass(): ClassDecorator {
    return;
});

export const CClass = new AnnotationFactory('tests').create(function CClass(): ClassDecorator {
    return;
});

export const DClass = new AnnotationFactory('tests').create(function DClass(): ClassDecorator {
    return;
});

export const XClass = new AnnotationFactory('tests').create(function XClass(): ClassDecorator {
    return;
});

export const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

export const BProperty = new AnnotationFactory('tests').create(function BProperty(): PropertyDecorator {
    return;
});

export const CProperty = new AnnotationFactory('tests').create(function CProperty(): PropertyDecorator {
    return;
});

export const DProperty = new AnnotationFactory('tests').create(function DProperty(): PropertyDecorator {
    return;
});

export const XProperty = new AnnotationFactory('tests').create(function XProperty(): PropertyDecorator {
    return;
});

export const AMethod = new AnnotationFactory('tests').create(function AMethod(): MethodDecorator {
    return;
});

export const BMethod = new AnnotationFactory('tests').create(function BMethod(): MethodDecorator {
    return;
});

export const CMethod = new AnnotationFactory('tests').create(function CMethod(): MethodDecorator {
    return;
});

export const DMethod = new AnnotationFactory('tests').create(function DMethod(): MethodDecorator {
    return;
});

export const XMethod = new AnnotationFactory('tests').create(function XMethod(): MethodDecorator {
    return;
});

export const AParameter = new AnnotationFactory('tests').create(function AParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

export const BParameter = new AnnotationFactory('tests').create(function BParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

export const CParameter = new AnnotationFactory('tests').create(function CParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

export const DParameter = new AnnotationFactory('tests').create(function DParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});

export const XParameter = new AnnotationFactory('tests').create(function XParameter(
    ...args: any[]
): ParameterDecorator {
    return;
});
