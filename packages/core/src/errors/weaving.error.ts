import { ReflectError } from '@aspectjs/common';

/**
 * Error thrown during the weaving process meaning the weaver has illegal state.
 */
export class WeavingError extends ReflectError {}
