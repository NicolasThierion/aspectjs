import { AnnotationFactory } from '../../annotation/factory/factory';
import { isString } from '../../utils';

const annotationFactory = new AnnotationFactory('aspectjs');

export interface AspectOptions {
    id?: string;
    priority?: number;
}

export const ASPECT_OPTIONS_REFLECT_KEY = 'aspectjs.aspect.options';

export function Aspect(id: string | AspectOptions = {}): ClassDecorator {
    return function (target: Function) {
        const options = isString(id) ? { id: id } : (id as AspectOptions) ?? {};
        Reflect.defineMetadata(ASPECT_OPTIONS_REFLECT_KEY, options, target);
    };
}

annotationFactory.create(function Aspect(): ClassDecorator {
    return;
});
