import { Advice } from '../../advice/types';

/**
 * Error thrown when an advice has an unexpected behavior (eg: returns a value that is not permitted)
 * @public
 */
export class AdviceError extends Error {
    constructor(advice: Advice, message: string) {
        super(`${advice}: ${message}`);
    }
}
