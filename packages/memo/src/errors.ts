import { DeserializationContext, SerializationContext } from './memo.types';

export class VersionConflictError extends Error {
    constructor(
        public readonly message: string,
        public readonly context: DeserializationContext | SerializationContext,
    ) {
        super(message);
    }
}
