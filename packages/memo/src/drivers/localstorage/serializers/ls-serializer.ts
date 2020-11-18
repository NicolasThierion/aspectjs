import {isUndefined} from "@aspectjs/core/utils";
import {parse, stringify} from "flatted";
import {MemoEntry} from "../../../memo.types";
import {MemoFrame} from "../../memo-frame";
import {LsMemoSerializer} from "./ls-serializer.type";

enum RawMemoField {
    VALUE,
    TYPE,
    INSTANCE_TYPE,
    EXPIRATION,
    VERSION,
}

const F = RawMemoField;

export class SimpleLsSerializer implements LsMemoSerializer {
    deserialize(serialized: string): Omit<MemoEntry, 'key'> {
        if (!serialized) {
            return null;
        }
        const raw = parse(serialized);
        return {
            expiration: raw[F.EXPIRATION] ? new Date(raw[F.EXPIRATION]) : undefined,
            frame: new MemoFrame({
                value: raw[F.VALUE],
                type: raw[F.TYPE],
                instanceType: raw[F.INSTANCE_TYPE],
                version: raw[F.VERSION],
            }),
        };
    }

    serialize(obj: Omit<MemoEntry, 'key'>): string {
        const raw = {} as any;

        if (!isUndefined(obj.frame.value)) {
            raw[F.VALUE] = obj.frame.value;
        }
        if (!isUndefined(obj.frame.type)) {
            raw[F.TYPE] = obj.frame.type;
        }
        if (!isUndefined(obj.frame.instanceType)) {
            raw[F.INSTANCE_TYPE] = obj.frame.instanceType;
        }
        if (!isUndefined(obj.frame.version)) {
            raw[F.VERSION] = obj.frame.version;
        }
        if (!isUndefined(obj.frame.version)) {
            raw[F.EXPIRATION] = obj.expiration;
        }
        return stringify(raw);
    }
}