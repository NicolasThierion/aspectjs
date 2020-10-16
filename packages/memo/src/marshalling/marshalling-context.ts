import { MemoKey } from '../memo.types';
import { MemoFrame } from '../drivers';
import { MemoMarshallerMode } from './marshallers';
import { assert, isArray, isObject, isPromise } from '../utils/utils';
import { MarshallersRegistry } from './marshallers-registry';

export class MarshallingContext<T = unknown> {
    private _blacklist: Map<any, MemoFrame<T>> = new Map<any, MemoFrame<T>>();
    defaultMarshal(value: T): MemoFrame<T> {
        return this._blacklist.has(value) ? this._blacklist.get(value) : this.marshal(value);
    }
    readonly async: Promise<any>[] = []; // marshalling will wait until these promises are resolved

    constructor(private readonly _marshallersRegistry: MarshallersRegistry, public readonly key: MemoKey) {}

    marshal(value: T): MemoFrame<T> {
        const type = value?.constructor.name ?? typeof value;
        const marshaller = this._marshallersRegistry.getMarshaller(type, MemoMarshallerMode.SYNC);

        const baseFrame = new MemoFrame<T>({ value, type });
        if (isObject(value) || isArray(value)) {
            this._blacklist.set(value, baseFrame);
        }

        return marshaller.marshal(baseFrame, this);
    }
}

export class UnmarshallingContext {
    blacklist?: Map<MemoFrame, any>;
    defaultUnmarshal<T>(frame: MemoFrame<T>): T {
        assert(!!frame);
        return this.blacklist.has(frame) ? this.blacklist.get(frame) : this.unmarshal(frame);
    }
    readonly async: Promise<any>[] = []; // unmarshalling will wait until these promises are resolved

    constructor(private readonly _marshallersRegistry: MarshallersRegistry, public readonly key: MemoKey) {}

    unmarshal<T>(frame: MemoFrame<T>): T {
        if (!frame) {
            return null;
        }

        this.blacklist = this.blacklist ?? new Map<MemoFrame, any>();
        assert(!!frame.type);
        const typeName = frame.type ?? '*';
        let mode = MemoMarshallerMode.SYNC;
        if (isPromise(frame.async)) {
            mode = MemoMarshallerMode.ASYNC;
            this.async.push(frame.async);
        }
        const marshaller = this._marshallersRegistry.getMarshaller(typeName, mode);

        frame.value = marshaller.unmarshal(frame, this);
        return frame.value;
    }
}
