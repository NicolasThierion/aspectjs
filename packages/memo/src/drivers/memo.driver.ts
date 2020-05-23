import { MarshallingContext, MemoEntry, MemoKey, UnmarshallingContext } from '../memo.types';
import { MemoFrame } from './memo-frame';
import { DateMarshaller } from '../marshallers/date-marshaller';
import { InstantPromise } from '../utils/instant-promise';
import { MemoMarshaller, MemoMarshallerMode } from '../marshallers/marshaller';
import { ObjectMarshaller } from '../marshallers/object-marshaller';
import { ArrayMarshaller } from '../marshallers/array-marshaller';
import { PromiseMarshaller } from '../marshallers/promise-marshaller';
import { AnyMarshaller } from '../marshallers/any-marshaller';
import { BasicMarshaller } from '../marshallers/basic-marshaller';
import { assert, isArray, isObject, isPromise } from '../utils/utils';

export interface MemoDriverOptions {
    marshallers?: MemoMarshaller[];
}

export const DEFAULT_MARSHALLERS: MemoMarshaller[] = [
    new ObjectMarshaller(),
    new ArrayMarshaller(),
    new DateMarshaller(),
    new PromiseMarshaller(),
    new AnyMarshaller(),
    new BasicMarshaller(),
];

type MarshallersRegistry = Record<
    string,
    {
        [s in MemoMarshallerMode]?: MemoMarshaller;
    }
>;
export abstract class MemoDriver {
    private _pendingResults: Record<string, MemoEntry> = {};
    private _marshallers: MarshallersRegistry;

    abstract getKeys(namespace?: string): Promise<MemoKey[]>;

    constructor(protected _options: MemoDriverOptions = {}) {
        this._marshallers = {};
        this.addMarshaller(...DEFAULT_MARSHALLERS, ...(_options.marshallers ?? []));
    }

    addMarshaller(...marshallers: MemoMarshaller[]): void {
        marshallers.forEach(marshaller => {
            [marshaller.modes].flat().forEach((mode: MemoMarshallerMode) => {
                [marshaller.types].flat().forEach((type: string) => {
                    this._marshallers[type] = this._marshallers[type] ?? {};
                    this._marshallers[type][mode] = marshaller;
                });
            });
        });
    }
    /**
     * Get the name of the driver this aspect uses.
     */
    abstract get NAME(): string;

    /** Get the priority this driver should be picked up to handle the given type.
     *  Priority < 1 means this driver do nit supports the given type.
     */
    abstract getPriority(type: any): number;

    /**
     * Returns the cached value.
     * @param key
     */
    protected abstract read<T>(key: MemoKey): MemoFrame<T>;

    protected abstract write(key: MemoKey, value: MemoFrame): PromiseLike<void>;

    protected abstract doRemove(key: MemoKey): PromiseLike<void>;

    getValue(key: MemoKey): MemoEntry {
        if (this._pendingResults[key.toString()]) {
            return this._pendingResults[key.toString()];
        }

        const frame = this.read(key);

        return this._unmarshal(frame, this.createUnmarshallingContext(key));
    }

    setValue<T>(entry: MemoEntry<T>): PromiseLike<void> {
        const key = entry.key;
        const context = this._createMarshallingContext(key);

        // promise resolution may not arrive in time in case the same method is called right after.
        // store the result in a temporary variable in order to be available right away
        this._pendingResults[key.toString()] = entry;

        const frame = this._marshal(entry.value, context);
        frame.expiry = entry.expiry;

        return InstantPromise.all(...context.async)
            .then(() => {
                this.write(key, frame);
                if (this._pendingResults[key.toString()] === entry) {
                    delete this._pendingResults[key.toString()];
                }
            })
            .then(() => {});
    }

    remove(key: MemoKey): PromiseLike<void> {
        return this.doRemove(key);
    }

    protected _marshal<T>(value: T, context: MarshallingContext): MemoFrame<T> {
        context.blacklist = context.blacklist ?? new Map<any, MemoFrame>();

        const type = value?.constructor.name ?? typeof value;
        const marshaller = this._getMarshaller(type, MemoMarshallerMode.SYNC);

        const baseFrame = new MemoFrame({ value, type });
        if (isObject(value) || isArray(value)) {
            context.blacklist.set(value, baseFrame);
        }

        return marshaller.marshal(baseFrame, context);
    }

    protected _unmarshal<T>(frame: MemoFrame<T>, context: UnmarshallingContext): MemoEntry<T> {
        if (!frame) {
            return null;
        }

        context.blacklist = context.blacklist ?? new Map<MemoFrame, any>();
        assert(!!frame.type);
        const typeName = frame.type ?? '*';
        let mode = MemoMarshallerMode.SYNC;
        if (isPromise(frame.async)) {
            mode = MemoMarshallerMode.ASYNC;
            context.async.push(frame.async);
        }
        const marshaller = this._getMarshaller(typeName, mode);

        frame.value = marshaller.unmarshal(frame, context);
        return {
            key: context.key,
            value: frame.value,
            expiry: frame.expiry,
        };
    }

    protected createUnmarshallingContext(key: MemoKey): UnmarshallingContext {
        const context: UnmarshallingContext = {
            key,
            defaultUnmarshal: <T>(frame: MemoFrame<T>) => {
                assert(!!frame);
                return context.blacklist.has(frame)
                    ? context.blacklist.get(frame)
                    : this._unmarshal(frame, context).value;
            },
            async: [],
        };
        return context;
    }

    protected _createMarshallingContext<T>(key: MemoKey): MarshallingContext<T> {
        const context: MarshallingContext<T> = {
            async: [],
            key,
            defaultMarshal: (v: T) => {
                return context.blacklist.has(v) ? context.blacklist.get(v) : this._marshal(v, context);
            },
        };

        return context;
    }

    protected _getMarshaller(typeName: string, mode: MemoMarshallerMode): MemoMarshaller {
        const marshaller = this._marshallers[typeName]?.[mode] ?? this._marshallers['*']?.[mode];

        if (!marshaller) {
            throw new TypeError(`No ${[mode]} marshaller to handle value of type ${typeName}`);
        }

        return marshaller;
    }
}
