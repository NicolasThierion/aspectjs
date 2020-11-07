import { _setAspectOptions } from '../../utils/utils';
import { isString } from '../../utils/utils';
import { ASPECTJS_ANNOTATION_FACTORY } from '../../utils/aspectjs.annotation.factory';

import { AnnotationRef } from '../../annotation/annotation.types';
// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;

let _globalAspectId = 0;

/**
 * @public
 */
export interface AspectOptions {
    id?: string;
}

/**
 * @public
 */
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

        _setAspectOptions(target, options);
    };
});
