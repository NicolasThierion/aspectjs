import { MemoFrame } from '../drivers/memo-frame';
import { MemoMarshaller, MemoMarshallerMode } from './marshaller';

export abstract class NoopMarshaller extends MemoMarshaller {
    marshal<T>(value: T): MemoFrame<T> {
        return new MemoFrame<T>({
            value,
        });
    }
    unmarshal<T>(frame: MemoFrame<T>): T {
        return frame.value;
    }

    readonly modes = [MemoMarshallerMode.SYNC];
}
