import { AspectError } from './aspect.error';

/**
 * Error thrown during the weaving process meaning the weaver has illegal state.
 */
export class WeavingError extends AspectError {}
