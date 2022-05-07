import { AdviceContext } from '@aspectjs/core';

/**
 * Thrown by aspects in case some error occurred during the aspect execution.
 * @public
 */
export class AspectError extends Error {
    constructor(ctxt: AdviceContext, message?: string) {
        super(`Error applying advice ${ctxt.advice} on ${ctxt.target.label}: ${message}`);
    }
}
