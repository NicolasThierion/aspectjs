import { MemoFrame } from '../../drivers';
import { MemoMarshaller } from './marshaller';

/**
 * Supports marshalling primitives
 * @public
 */
export class BasicMarshaller extends MemoMarshaller<any> {
    readonly types = ['Number', 'String', 'Boolean', 'symbol', 'number', 'string', 'boolean', 'symbol', 'undefined'];

    marshal<T>(frame: MemoFrame<T>): MemoFrame<T> {
        return frame;
    }
    unmarshal<T>(frame: MemoFrame<T>): T {
        return frame.value;
    }
}
