import { AnnotationTarget } from '@aspectjs/common';

import { AdviceType } from '../advice/advice.type';
import { AspectError } from './aspect.error';

/**
 * Error thrown when an advice has an unexpected behavior (eg: returns a value that is not permitted)
 */
export class AdviceError extends AspectError {
  constructor(
    public readonly advice: AdviceType<any, any, any>,
    public readonly target: AnnotationTarget,
    message: string,
  ) {
    super(`Error applying advice ${advice} on ${target.label}: ${message}`);
  }
}
