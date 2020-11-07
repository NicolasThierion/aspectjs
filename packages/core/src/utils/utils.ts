import { getProto } from '@aspectjs/core/utils';
import { AspectType } from '../weaver/types';
import { AspectOptions } from '../advice/aspect.annotation';
import { AnnotationFactory } from '../annotation/factory/annotation-factory';
import { assert, isFunction } from '@aspectjs/core/utils';

export type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};
export const ASPECTJS_ANNOTATION_FACTORY = new AnnotationFactory('aspectjs');
const ASPECT_OPTIONS_REFLECT_KEY = 'aspectjs.aspect.options';
const ASPECT_ORIGINAL_CTOR_KEY = 'aspectjs.referenceConstructor';

export function getReferenceConstructor(proto: object & { constructor: { new (...args: unknown[]): unknown } }) {
    return Reflect.getOwnMetadata(ASPECT_ORIGINAL_CTOR_KEY, proto) ?? proto.constructor;
}

export function setReferenceConstructor<T>(
    ctor: { new (...args: any[]): T },
    originalCtor: { new (...args: any[]): T },
) {
    assert(isFunction(originalCtor));
    assert(isFunction(ctor));
    Reflect.defineMetadata(ASPECT_ORIGINAL_CTOR_KEY, originalCtor, getProto(ctor));
}

export function isAspect(aspect: AspectType | Function) {
    return !!_getAspectOptions(aspect);
}

export function assertIsAspect(aspect: AspectType | Function) {
    if (!isAspect(aspect)) {
        const proto = getProto(aspect);
        throw new TypeError(`${proto.constructor.name} is not an Aspect`);
    }
}

function _getAspectOptions(aspect: AspectType | Function): AspectOptions {
    if (!aspect) {
        return;
    }
    const proto = getProto(aspect);
    if (proto) {
        return Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, proto);
    }
}
export function getAspectOptions(aspect: AspectType | Function): AspectOptions {
    assertIsAspect(aspect);
    return _getAspectOptions(aspect);
}

export function setAspectOptions(target: Function, options: AspectOptions) {
    Reflect.defineMetadata(ASPECT_OPTIONS_REFLECT_KEY, options, getProto(target));
}
