import { MemoMarshaller, MemoMarshallerMode } from './marshallers/marshaller';
import { MemoEntry, MemoKey } from '../memo.types';
import { MarshallingContext, UnmarshallingContext } from './marshalling-context';
import { MemoFrame } from '../drivers';
import { assert, isPromise } from '../utils/utils';

export class MarshallersRegistry {
    private _marshallers: Record<
        string,
        {
            [s in MemoMarshallerMode]?: MemoMarshaller;
        }
    > = {};

    addMarshaller(...marshallers: MemoMarshaller[]): this {
        marshallers.forEach((marshaller) => {
            [marshaller.modes].flat().forEach((mode: MemoMarshallerMode) => {
                [marshaller.types].flat().forEach((type: string) => {
                    this._marshallers[type] = this._marshallers[type] ?? {};
                    this._marshallers[type][mode] = marshaller;
                });
            });
        });

        return this;
    }

    getMarshaller(typeName: string, mode: MemoMarshallerMode): MemoMarshaller {
        const marshaller = this._marshallers[typeName]?.[mode] ?? this._marshallers['*']?.[mode];

        if (!marshaller) {
            throw new TypeError(`No ${[mode]} marshaller to handle value of type ${typeName}`);
        }

        return marshaller;
    }

    createMarshallingContext<T>(key: MemoKey): MarshallingContext<T> {
        return new MarshallingContext<T>(this, key);
    }

    createUnmarshallingContext(key: MemoKey): UnmarshallingContext {
        return new UnmarshallingContext(this, key);
    }
}
