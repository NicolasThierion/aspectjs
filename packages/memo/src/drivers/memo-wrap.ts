export interface MemoWrapper<T = any> {
    wrap(): any;
    unwrap(): any;
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
    [MemoWrapField.VALUE]: T | [];
    [MemoWrapField.TYPE]: string;
    [MemoWrapField.INSTANCE_TYPE]?: string;
    [MemoWrapField.EXPIRY]?: Date;
    [MemoWrapField.VERSION]?: string;
    [MemoWrapField.DATE]: Date;
}
