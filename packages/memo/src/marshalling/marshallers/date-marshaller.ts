import { MemoFrame } from '../../drivers';
import { parse, stringify } from 'flatted';
import { MemoMarshaller } from './marshaller';

/**
 * Supports marshalling Dates
 * @public
 */
export class DateMarshaller extends MemoMarshaller<Date, string> {
    readonly types = 'Date';

    marshal(frame: MemoFrame<Date>): MemoFrame<string> {
        return frame.setValue(stringify(frame.value));
    }

    unmarshal(frame: MemoFrame<string>): Date {
        return new Date(parse(frame.value as any));
    }
}
