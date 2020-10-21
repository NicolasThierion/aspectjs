import { AnnotationFactory } from '../annotation/factory/annotation-factory';
import { isString } from '@aspectjs/core/utils';

let _globalAspectId = 0;

const annotationFactory = new AnnotationFactory('aspectjs');

export interface AspectOptions {
    id?: string;
    priority?: number;
}

export const ASPECT_OPTIONS_REFLECT_KEY = 'aspectjs.aspect.options';

export function Aspect(id: string | AspectOptions = {}): ClassDecorator {
    return function (target: Function) {
        const options = isString(id) ? { id: id } : (id as AspectOptions) ?? {};

        if (options.id === undefined) {
            options.id = `AnonymousAspect#${_globalAspectId++}`;
        } else if (!isString(options.id)) {
            throw new TypeError(`Aspect ${target.name} should have a string id. Got: ${options.id}`);
        }

        Reflect.defineMetadata(ASPECT_OPTIONS_REFLECT_KEY, options, target);
    };
}

annotationFactory.create(function Aspect(): ClassDecorator {
    return;
});
