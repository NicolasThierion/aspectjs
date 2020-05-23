import { MemoFrame } from '../drivers/memo-frame';
import { UnmarshallingContext, MarshallingContext } from '../memo.types';
import { MemoMarshaller, MemoMarshallerMode } from './marshaller';

export class ArrayMarshaller extends MemoMarshaller {
    readonly modes = MemoMarshallerMode.SYNC;
    readonly types = 'Array';

    marshal(frame: MemoFrame<unknown[]>, context: MarshallingContext): MemoFrame<any[]> {
        // array may contain promises
        frame.value = frame.value.map(i => context.defaultMarshal(i));

        return frame;
    }
    unmarshal(frame: MemoFrame<unknown[]>, context: UnmarshallingContext): unknown[] {
        // assert(wrapped[F.TYPE] === ValueType.ARRAY);
        const value = [] as any[];

        context.blacklist.set(frame, value);
        value.push(...((frame.value as any) as any[]).map(w => context.defaultUnmarshal(w)));
        return value;
    }
}
