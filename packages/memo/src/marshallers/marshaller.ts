// TODO have marshaller extend this class
import { MemoFrame } from '../drivers/memo-frame';
import { UnmarshallingContext, MarshallingContext } from '../memo.types';

export enum MemoMarshallerMode {
    SYNC = 'sync',
    ASYNC = 'async',
}
export abstract class MemoMarshaller<T = any, M = T> {
    abstract readonly types: string | string[];
    abstract readonly modes: MemoMarshallerMode | MemoMarshallerMode[] = [MemoMarshallerMode.SYNC];
    createBaseValue(): T {
        return;
    }

    abstract marshal(frame: MemoFrame<T>, context: MarshallingContext): MemoFrame<M>;
    abstract unmarshal(frame: MemoFrame<M>, context: UnmarshallingContext): T;
}
