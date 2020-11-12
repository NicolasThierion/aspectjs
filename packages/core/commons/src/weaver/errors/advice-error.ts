import { Advice } from '../../advices';
import { WeavingError } from './weaving-error';

/**
 * Error thrown when an advice has an unexpected behavior (eg: returns a value that is not permitted)
 * @public
 */
export class AdviceError extends WeavingError {
    constructor(advice: Advice, message: string) {
        super(`${advice}: ${message}`);
    }
}
