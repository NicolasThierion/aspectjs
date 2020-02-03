import { AnnotationFactory } from '../../annotation/factory/factory';
import { isString } from '../../utils';

const annotationFactory = new AnnotationFactory('aspectjs');

export interface AspectOptions {
    id?: string;
    priority?: number;
}

export function Aspect(id: string | AspectOptions = {}): ClassDecorator {
    return function(target: Function) {
        const options = isString(id) ? { id: id } : (id as AspectOptions) ?? {};
        Reflect.defineMetadata(`aspectjs.aspect.options`, options, target);
    };
}

annotationFactory.create(function Aspect(): ClassDecorator {
    return;
});
