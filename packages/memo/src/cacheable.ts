import { AnnotationFactory } from '@aspectjs/core';

const af = new AnnotationFactory('aspectjs');

export interface CacheableOptions {
    typeId?: string;
}
function Cacheable(opts?: CacheableOptions): ClassDecorator;
function Cacheable(typeId?: string): ClassDecorator;
function Cacheable(typeId?: string | CacheableOptions): ClassDecorator {
    return;
}

const _Cacheable = af.create(Cacheable);

export { _Cacheable as Cacheable };
