import { MemoFrame } from '../../drivers/memo-frame';
import { MemoMarshaller, MemoMarshallerMode } from './marshaller';
import { from, Observable } from 'rxjs';
import { MarshallingContext, UnmarshallingContext } from '../marshalling-context';

export class ObservableMarshaller extends MemoMarshaller<Observable<any>, any> {
    readonly modes = [MemoMarshallerMode.ASYNC, MemoMarshallerMode.SYNC];
    readonly types = 'Observable';

    marshal(frame: MemoFrame<Observable<unknown>>, context: MarshallingContext): MemoFrame<Observable<any>> {
        context.async.push(frame.value.toPromise().then((v) => frame.setValue(context.defaultMarshal(v))));
        return frame;
    }

    unmarshal(frame: MemoFrame<MemoFrame<any>>, context: UnmarshallingContext): Observable<any> {
        if (context.async.length) {
            return from(
                Promise.all(context.async).then((results) => {
                    return context.defaultUnmarshal(results[0]);
                }),
            );
        } else {
            return from(context.defaultUnmarshal(frame.value));
        }
    }
}
