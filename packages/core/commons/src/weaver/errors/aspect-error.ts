import { AdviceContext } from '../../advices';

/**
 * Thrown by aspects in case some error occurred during the aspect execution.
 * @public
 */
export class AspectError extends Error {
    constructor(ctxt: AdviceContext, message: string) {
        super(`@${ctxt.annotation.name} on ${ctxt.target.label}: ${message}`);
    }
}
