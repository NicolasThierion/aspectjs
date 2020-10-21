import { UnmarshallingContext } from './marshalling/marshalling-context';

export class MemoAspectError extends Error {
    constructor(public readonly message: string) {
        super(message);
    }
}

export class VersionConflictError extends MemoAspectError {
    constructor(public readonly message: string, public readonly context: UnmarshallingContext) {
        super(message);
    }
}
