import { assert } from '@aspectjs/core/utils';
import { MemoFrame } from '../../drivers';
import { MarshalFn, MemoMarshaller, UnmarshalFn } from './marshaller';
import { MarshallingContext, UnmarshallingContext } from '../marshalling-context';

export class ObjectMarshaller extends MemoMarshaller {
    readonly types = ['Object', 'object'];

    // eslint-disable-next-line @typescript-eslint/ban-types
    marshal(frame: MemoFrame<object>, context: MarshallingContext, defaultMarshal: MarshalFn): MemoFrame<object> {
        if (!frame.value) {
            return frame;
        }
        return frame.setValue(
            ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(frame.value))
                .concat(Object.getOwnPropertySymbols(frame.value))
                .reduce((w, k) => {
                    const v = (frame.value as any)[k];

                    w[k] = defaultMarshal(v);

                    return w;
                }, {} as any),
        );
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    unmarshal(frame: MemoFrame<object>, context: UnmarshallingContext, defaultUnmarshal: UnmarshalFn): object {
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
                v[k] = defaultUnmarshal((frame.value as any)[k]);
                return v;
            }, value as any);
    }
}
