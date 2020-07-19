import { MemoFrame } from '../drivers/memo-frame';
import { UnmarshallingContext, MarshallingContext } from '../memo.types';
import { assert } from '../utils/utils';
import { MemoMarshaller, MemoMarshallerMode } from './marshaller';

export class ObjectMarshaller extends MemoMarshaller {
    readonly modes: MemoMarshallerMode.SYNC;
    readonly types = ['Object', 'object'];

    // eslint-disable-next-line @typescript-eslint/ban-types
    marshal(frame: MemoFrame<object>, context: MarshallingContext): MemoFrame<object> {
        assert(!!frame.type);
        if (!frame.value) {
            return frame;
        }
        return frame.setValue(
            ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(frame.value))
                .concat(Object.getOwnPropertySymbols(frame.value))
                .reduce((w, k) => {
                    const v = (frame.value as any)[k];

                    w[k] = context.defaultMarshal(v);

                    return w;
                }, {} as any),
        );
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    unmarshal(frame: MemoFrame<object>, context: UnmarshallingContext): object {
        if (frame.value === null) {
            return null;
        }
        const value: any = {};
        context.blacklist.set(frame, value);
        assert(!!frame.value);
        return ([] as (string | symbol)[])
            .concat(Object.getOwnPropertyNames(frame.value))
            .concat(Object.getOwnPropertySymbols(frame.value))
            .reduce((v, k) => {
                v[k] = context.defaultUnmarshal((frame.value as any)[k]);
                return v;
            }, value as any);
    }
}
