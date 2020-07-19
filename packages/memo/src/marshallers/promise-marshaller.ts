import { MemoFrame } from '../drivers/memo-frame';
import { UnmarshallingContext, MarshallingContext } from '../memo.types';
import { MemoMarshaller, MemoMarshallerMode } from './marshaller';

export class PromiseMarshaller extends MemoMarshaller<Promise<any>, any> {
    readonly modes = [MemoMarshallerMode.ASYNC, MemoMarshallerMode.SYNC];
    readonly types = 'Promise';

    marshal(frame: MemoFrame<Promise<unknown>>, context: MarshallingContext): MemoFrame<Promise<any>> {
        context.async.push(frame.value.then((v) => frame.setValue(context.defaultMarshal(v))));
        return frame;
    }

    unmarshal(frame: MemoFrame<MemoFrame<any>>, context: UnmarshallingContext): Promise<any> {
        if (context.async.length) {
            return Promise.all(context.async).then((results) => {
                return context.defaultUnmarshal(results[0]);
            });
        } else {
            return Promise.resolve(context.defaultUnmarshal(frame.value));
        }
    }
}
