import { isString } from '@aspectjs/core/utils';
import { ASPECTJS_ANNOTATION_FACTORY, setAspectOptions } from '../utils/utils';

let _globalAspectId = 0;

export interface AspectOptions {
    id?: string;
}

export const Aspect = ASPECTJS_ANNOTATION_FACTORY.create(function Aspect(
    id: string | AspectOptions = {},
): ClassDecorator {
    return function (target: Function) {
        const options = isString(id) ? { id: id } : (id as AspectOptions) ?? {};

        if (options.id === undefined) {
            options.id = `AnonymousAspect#${_globalAspectId++}`;
        } else if (!isString(options.id)) {
            throw new TypeError(`Aspect ${target.name} should have a string id. Got: ${options.id}`);
        }

        setAspectOptions(target, options);
    };
});
