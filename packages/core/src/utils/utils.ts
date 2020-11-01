import { getProto } from '@aspectjs/core/utils';
import { AspectType } from '../weaver/types';
import { ASPECT_OPTIONS_REFLECT_KEY, AspectOptions } from '../advice/aspect';
import { AnnotationFactory } from '../annotation/factory/annotation-factory';

export type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};
export const annotationFactory = new AnnotationFactory('aspectjs');

export function isAspect(aspect: AspectType | Function) {
    if (!aspect) {
        return false;
    }
    const proto = getProto(aspect);
    if (proto.constructor) {
        if (!!Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, proto.constructor)) {
            return true;
        }
    }

    return false;
}

export function assertIsAspect(aspect: AspectType | Function) {
    const proto = getProto(aspect);
    if (!isAspect(aspect)) {
        throw new TypeError(`${proto.constructor.name} is not an Aspect`);
    }
}

export function getAspectOptions(aspect: AspectType | Function): AspectOptions {
    assertIsAspect(aspect);
    return Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, getProto(aspect).constructor);
}
