import { MemoMarshaller } from './marshallers/marshaller';
import { MemoKey } from '../memo.types';
import { MarshallingContext, UnmarshallingContext } from './marshalling-context';
import { MemoFrame } from '../drivers';
import { assert, isArray, isObject } from '@aspectjs/core/utils';
import { InstantPromise } from '../utils/instant-promise';

export class MarshallersRegistry {
    private _marshallers: Record<string, MemoMarshaller> = {};

    addMarshaller(...marshallers: MemoMarshaller[]): this {
        marshallers.forEach((marshaller) => {
            [marshaller.types].flat().forEach((type: string) => {
                this._marshallers[type] = marshaller;
            });
        });

        return this;
    }

    getMarshaller(typeName: string): MemoMarshaller {
        const marshaller = this._marshallers[typeName] ?? this._marshallers['*'];

        if (!marshaller) {
            throw new TypeError(`No marshaller to handle value of type ${typeName}`);
        }

        return marshaller;
    }

    marshal<T>(key: MemoKey, value: T): MarshallingContext<T> {
        return new MarshallingContextImpl(this, key, value);
    }

    unmarshal(key: MemoKey, frame: MemoFrame<any>) {
        return new UnmarshallingContextImpl(this, key, frame).frame.value;
    }
}

class MarshallingContextImpl<T> implements MarshallingContext<T> {
    private _blacklist: Map<any, MemoFrame<T>> = new Map<any, MemoFrame<T>>();
    private readonly _promises: Promise<any>[] = [];
    readonly frame: MemoFrame<T>;

    constructor(
        private readonly _marshallersRegistry: MarshallersRegistry,
        public readonly key: MemoKey,
        public readonly value: T,
    ) {
        this.frame = this._defaultMarshal(this.value);
    }

    private _defaultMarshal(value: T): MemoFrame<T> {
        if (this._blacklist.has(value)) {
            return this._blacklist.get(value);
        }

        const type = value?.constructor.name ?? typeof value;
        const marshaller = this._marshallersRegistry.getMarshaller(type);

        const baseFrame = new MemoFrame<T>({ value, type });
        if (isObject(value) || isArray(value)) {
            this._blacklist.set(value, baseFrame);
        }

        const frame = marshaller.marshal(baseFrame, this, this._defaultMarshal.bind(this));
        if (frame.isAsync()) {
            this._promises.push(frame.async);
        }
        return frame;
    }

    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: MemoFrame<T>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): PromiseLike<TResult1> {
        return InstantPromise.all(...this._promises)
            .then(() => this.frame)
            .then(onfulfilled, onrejected) as PromiseLike<TResult1>;
    }
}

class UnmarshallingContextImpl<T = unknown> implements UnmarshallingContext<T> {
    readonly blacklist?: Map<MemoFrame, any> = new Map<MemoFrame, any>();

    constructor(
        private readonly _marshallersRegistry: MarshallersRegistry,
        public readonly key: MemoKey,
        public readonly frame: MemoFrame<T>,
    ) {
        this._defaultUnmarshal(this.frame);
    }

    _defaultUnmarshal<T>(frame: MemoFrame<T>): T {
        assert(!!frame);
        if (this.blacklist.has(frame)) {
            return this.blacklist.get(frame);
        }

        if (!frame) {
            return null;
        }
        if (!(frame instanceof MemoFrame)) {
            Reflect.setPrototypeOf(frame, MemoFrame.prototype);
        }

        assert(!!frame.type);
        const typeName = frame.type ?? '*';

        const marshaller = this._marshallersRegistry.getMarshaller(typeName);

        frame.value = marshaller.unmarshal(frame, this, this._defaultUnmarshal.bind(this));
        return frame.value;
    }
}
