import { DeserializationContext, SerializationContext } from '../memo.types';

export interface MemoWrapper<T = any> {
    wrap(wrap: MemoWrap<T>, value: T, context: SerializationContext): MemoWrap<T>;
    unwrap(wrap: MemoWrap<T>, context: DeserializationContext): T;
}

enum MemoWrapField {
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
export class MemoWrap<T = any> {
    private [MemoWrapField.VALUE]: T;
    private [MemoWrapField.DATE]: Date;
    private [MemoWrapField.TYPE]?: string;
    private [MemoWrapField.EXPIRY]?: Date;
    private [MemoWrapField.INSTANCE_TYPE]?: string;
    private [MemoWrapField.VERSION]?: string;

    get value() {
        return this[MemoWrapField.VALUE];
    }

    set value(value: T) {
        this[MemoWrapField.VALUE] = value;
    }

    get type() {
        return this[MemoWrapField.TYPE];
    }

    set type(type: string) {
        this[MemoWrapField.TYPE] = type;
    }

    get instanceType() {
        return this[MemoWrapField.INSTANCE_TYPE];
    }

    set instanceType(instanceType: string) {
        this[MemoWrapField.INSTANCE_TYPE] = instanceType;
    }

    get expiry() {
        return this[MemoWrapField.EXPIRY];
    }

    set expiry(expiry: Date) {
        this[MemoWrapField.EXPIRY] = expiry;
    }

    get version() {
        return this[MemoWrapField.VERSION];
    }

    set version(version: string) {
        this[MemoWrapField.VERSION] = version;
    }

    get date() {
        return this[MemoWrapField.DATE];
    }

    set date(date: Date) {
        this[MemoWrapField.DATE] = date;
    }
}
