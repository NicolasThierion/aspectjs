import { MemoFrame } from '../../drivers/memo-frame';
import { parse, stringify } from 'flatted';
import { MemoMarshaller } from './marshaller';

export class DateMarshaller extends MemoMarshaller<Date, string> {
    readonly types = 'Date';

    marshal(frame: MemoFrame<Date>): MemoFrame<string> {
        return frame.setValue(stringify(frame.value));
    }

    unmarshal(frame: MemoFrame<string>): Date {
        return new Date(parse(frame.value as any));
    }
}
