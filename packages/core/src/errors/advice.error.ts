import { AnnotationTarget } from '@aspectjs/common';

import { Advice } from '../advice/advice.type';
import { AspectType } from '../aspect/aspect.type';
import { AspectError } from './aspect.error';

/**
 * Error thrown when an advice has an unexpected behavior (eg: returns a value that is not permitted)
 */
export class AdviceError extends AspectError {
  constructor(
    /**
     * The aspect that caused the error
     */
    public readonly aspect: AspectType,
    /**
     * The advice that caused the error
     */
    public readonly advice: Advice<any, any, any>,
    /**
     * The target on which the advice was applied
     */
    public readonly target: AnnotationTarget,
    /**
     * The error message
     */
    message: string,
  ) {
    super(
      aspect,
      `Error applying advice ${advice} on ${target.label}: ${message}`,
    );
  }
}
