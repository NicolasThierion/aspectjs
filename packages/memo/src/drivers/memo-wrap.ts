import { DeserializationContext, SerializationContext } from '../memo.types';

export interface MemoWrapper<T = any> {
    wrap(wrap: MemoWrap<T>, value: T, context: SerializationContext): MemoWrap<T>;
    unwrap(wrap: MemoWrap<T>, context: DeserializationContext): T;
}

export enum MemoWrapField {
    VALUE,
    TYPE,
    INSTANCE_TYPE,
    EXPIRY,
    VERSION,
    DATE,
}

/**
 * The serialized representation of a MemoValue
 */
export interface MemoWrap<T = any> {
    [MemoWrapField.VALUE]: T;
    [MemoWrapField.TYPE]: string;
    [MemoWrapField.INSTANCE_TYPE]?: string;
    [MemoWrapField.EXPIRY]?: Date;
    [MemoWrapField.VERSION]?: string;
    [MemoWrapField.DATE]: Date;
}
