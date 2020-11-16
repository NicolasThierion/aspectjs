import { ASPECTJS_ANNOTATION_FACTORY, AnnotationRef } from '@aspectjs/core/commons';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;

export interface CacheableOptions {
    /** Identifies the type of object to be cached. If not provided, a typeId should is generated automatically **/
    typeId?: string;
    /** Any entry of the @Cacheable object with a different version is evicted from the cache. Supports SemVer versioning **/
    version?: string | number | (() => string | number);
}
function Cacheable(opts?: CacheableOptions): ClassDecorator;
function Cacheable(typeId?: string): ClassDecorator;
function Cacheable(typeId?: string | CacheableOptions): ClassDecorator {
    return;
}

const _Cacheable = ASPECTJS_ANNOTATION_FACTORY.create(Cacheable);

export { _Cacheable as Cacheable };
