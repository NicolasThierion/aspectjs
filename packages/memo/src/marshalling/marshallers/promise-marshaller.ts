import { MemoFrame } from '../../drivers';
import { MarshalFn, MemoMarshaller, UnmarshalFn } from './marshaller';
import { MarshallingContext, UnmarshallingContext } from '../marshalling-context';

/**
 * Supports marshalling promises
 * @public
 */
export class PromiseMarshaller extends MemoMarshaller<Promise<any>, any> {
    readonly types = 'Promise';

    marshal(
        frame: MemoFrame<Promise<unknown>>,
        context: MarshallingContext,
        defaultMarshal: MarshalFn,
    ): MemoFrame<Promise<any>> {
        frame.setAsyncValue(frame.value.then((v) => defaultMarshal(v)));
        return frame;
    }

    unmarshal(
        frame: MemoFrame<MemoFrame<any>>,
        context: UnmarshallingContext,
        defaultUnmarshal: UnmarshalFn,
    ): Promise<any> {
        if (frame.isAsync()) {
            return frame.async.then((v) => {
                return defaultUnmarshal(v);
            });
        } else {
            return Promise.resolve(defaultUnmarshal(frame.value));
        }
    }
}
