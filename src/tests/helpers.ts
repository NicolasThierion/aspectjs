import { setWeaver } from '..';
import { LoadTimeWeaver } from '../weaver/load-time/load-time-weaver';
import { AnnotationFactory } from '../annotation/factory/factory';

export interface Labeled {
    labels?: string[];
}

export function setupWeaver(...aspects: object[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

export const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

export const AClass = new AnnotationFactory('tests').create(function AClass(): ClassDecorator {
    return;
});
