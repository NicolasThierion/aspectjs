import { setWeaver } from '../src/lib';
import { LoadTimeWeaver } from '../src/weaver/load-time/load-time-weaver';
import { AnnotationFactory } from '../src/annotation/factory/factory';

export interface Labeled {
    labels?: string[];
    addLabel?: (...args: any[]) => any;
}

export function setupWeaver(...aspects: object[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

export const AClass = new AnnotationFactory('tests').create(function AClass(): ClassDecorator {
    return;
});

export const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
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
