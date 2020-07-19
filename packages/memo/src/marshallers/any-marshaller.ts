import { getWeaver, WeavingError } from '@aspectjs/core';
import { MemoFrame } from '../drivers/memo-frame';
import { MarshallingContext, UnmarshallingContext } from '../memo.types';
import { assert, provider } from '../utils/utils';
import { VersionConflictError } from '../errors';
import { CacheableAspect, CacheTypeStore } from '../cacheable/cacheable.aspect';
import { MemoMarshaller, MemoMarshallerMode } from './marshaller';
import { ObjectMarshaller } from './object-marshaller';

export class AnyMarshaller extends MemoMarshaller {
    readonly modes: MemoMarshallerMode.SYNC;
    readonly types = '*';

    constructor(private _objectMarshaller = new ObjectMarshaller()) {
        super();
    }
    marshal(frame: MemoFrame<object>, context: MarshallingContext): MemoFrame {
        // delete wrap.type; // Do not store useless type, as INSTANCE_TYPE is used for objects of non-built-in types.
        const proto = Reflect.getPrototypeOf(frame.value);

        const ts = typeStore();
        const instanceType = ts.getTypeKey(proto);
        const newFrame = this._objectMarshaller.marshal(frame, context);

        newFrame.instanceType = instanceType;
        newFrame.version = provider(ts.getVersion(instanceType))();

        return newFrame;
    }
    unmarshal(frame: MemoFrame<object>, context: UnmarshallingContext): any {
        frame.value = this._objectMarshaller.unmarshal(frame, context);

        assert(!!frame.instanceType);
        const ts = typeStore();
        const proto = ts.getPrototype(frame.instanceType);
        const version = provider(ts.getVersion(frame.instanceType))();
        if (version !== frame.version) {
            if (version !== frame.version) {
                throw new VersionConflictError(
                    `Object for key ${frame.instanceType} is of version ${version}, but incompatible version ${frame.version} was already cached`,
                    context,
                );
            }
        }

        Reflect.setPrototypeOf(frame.value, proto);

        return frame.value;
    }
}

function typeStore(): CacheTypeStore {
    const weaver = getWeaver();
    if (!weaver) {
        throw new WeavingError('no weaver configured. Please call setWeaver()');
    }

    const cacheableAspect = weaver.getAspect('@aspectjs/cacheable') as CacheableAspect;

    if (!cacheableAspect) {
        throw new WeavingError(
            'MemoAspect requires an aspect to be registered for id "@aspectjs/cacheable".' +
                ' Did you forgot to call getWeaver().enable(new DefaultCacheableAspect()) ?',
        );
    }

    return cacheableAspect.cacheTypeStore;
}
