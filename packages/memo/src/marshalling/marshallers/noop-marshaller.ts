import { MemoFrame } from '../../drivers';
import { MemoMarshaller } from './marshaller';

/**
 * Pass-through marshaller
 * @public
 */
export abstract class NoopMarshaller extends MemoMarshaller {
    marshal<T>(value: T): MemoFrame<T> {
        return new MemoFrame<T>({
            value,
        });
    }
    unmarshal<T>(frame: MemoFrame<T>): T {
        return frame.value;
    }
}
