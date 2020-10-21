import { AspectType } from '../../src/weaver/types';
import { JitWeaver } from '../../src/weaver/jit/jit-weaver';
import { AnnotationFactory } from '../../src/annotation/factory/annotation-factory';
import { weaverContext } from '../../src/weaver/weaver-context';

export interface Labeled {
    labels?: string[];
    addLabel?: (...args: any[]) => any;
}
export function setupWeaver(...aspects: AspectType[]) {
    const weaver = new JitWeaver().enable(...aspects);
    weaverContext.setWeaver(weaver);
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

export const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

export const BProperty = new AnnotationFactory('tests').create(function BProperty(): PropertyDecorator {
    return;
});

export const AMethod = new AnnotationFactory('tests').create(function AMethod(): MethodDecorator {
    return;
});

export const BMethod = new AnnotationFactory('tests').create(function BMethod(): MethodDecorator {
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
