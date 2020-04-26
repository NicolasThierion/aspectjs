import { AnnotationType, Aspect, Compile, CompileContext, on } from '@aspectjs/core';
import { Cacheable, CacheableOptions } from './cacheable';
import { assert, getMetaOrDefault, isObject } from './utils';

type Prototype = {
    constructor: Function;
};

export interface CacheableAspect {
    readonly cacheTypeStore: CacheTypeStore;
}

export interface CacheTypeStore {
    getPrototype(key: string): Prototype;
    getTypeKey<T extends Prototype>(proto: T): string;

    addPrototype<T extends Prototype>(proto: T, key: string): void;
}

@Aspect('@aspectjs/cacheable')
export class DefaultCacheableAspect implements CacheableAspect {
    constructor(public readonly cacheTypeStore: CacheTypeStore = new CacheTypeStoreImpl()) {}
    @Compile(on.class.withAnnotations(Cacheable))
    registerCacheKey(ctxt: CompileContext<any, AnnotationType.CLASS>) {
        let options = ctxt.annotation.args[0] as CacheableOptions;
        if (!isObject(options)) {
            options = {
                typeId: options,
            };
        }
        const typeId = options.typeId ?? _generateTypeId(ctxt.target.proto);
        this.cacheTypeStore.addPrototype(ctxt.target.proto, typeId);
    }
}

export class CacheTypeStoreImpl implements CacheTypeStore {
    private readonly _cacheStore: Record<string, Prototype> = {};

    getPrototype(key: string): Prototype {
        assert(!!key, 'key must be defined');
        const proto = this._cacheStore[key];
        if (!proto) {
            throw new Error(`no prototype found for key ${key}`);
        }
        return proto;
    }

    getTypeKey<T extends Prototype>(prototype: T): string {
        const key = _generateTypeId(prototype);
        if (!this._cacheStore[key]) {
            throw new TypeError(
                `Cannot find cache key for object ${prototype.constructor.name}. Are you sure you are caching a class annotated with "@Cacheable()"?`,
            );
        }
        return key;
    }

    addPrototype<T extends Prototype>(proto: Prototype, key: string): void {
        if (this._cacheStore[key] && this._cacheStore[key] !== proto) {
            throw new Error(
                `Cannot add key for ${proto?.constructor?.name}: key already exists for ${this._cacheStore[key]?.constructor?.name}`,
            );
        }

        this._cacheStore[key] = proto;
    }
}

let globalId = 0;
function _generateTypeId(proto: any): string {
    return getMetaOrDefault('@aspectjs/cacheable:typekey', proto, () => {
        return `${proto.constructor.name}#${globalId++}`;
    });
}
