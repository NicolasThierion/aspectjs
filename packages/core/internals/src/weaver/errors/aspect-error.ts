import { AdviceContext } from '../../advice/advice-context';

export class AspectError extends Error {
    constructor(ctxt: AdviceContext, message: string) {
        super(`@${ctxt.annotation.name} on ${ctxt.target.label}: ${message}`);
    }
}
