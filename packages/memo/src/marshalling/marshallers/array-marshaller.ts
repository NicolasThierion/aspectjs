import { MemoFrame } from '../../drivers';
import { MarshalFn, MemoMarshaller, UnmarshalFn } from './marshaller';
import { MarshallingContext, UnmarshallingContext } from '../marshalling-context';

/**
 * Supports marshalling arrays
 * @public
 */
export class ArrayMarshaller extends MemoMarshaller {
    readonly types = 'Array';

    marshal(frame: MemoFrame<unknown[]>, context: MarshallingContext, defaultMarshal: MarshalFn): MemoFrame<any[]> {
        // array may contain promises
        frame.value = frame.value.map((i) => defaultMarshal(i));

        return frame;
    }
    unmarshal(frame: MemoFrame<unknown[]>, context: UnmarshallingContext, defaultUnmarshal: UnmarshalFn): unknown[] {
        // assert(wrapped[F.TYPE] === ValueType.ARRAY);
        const value = [] as any[];

        context.blacklist.set(frame, value);
        value.push(...((frame.value as any) as any[]).map((w) => defaultUnmarshal(w)));
        return value;
    }
}
