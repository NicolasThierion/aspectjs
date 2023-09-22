import { AspectType, ASPECT_ID_SYMBOL } from '../aspect/aspect.type';
import { WeavingError } from './weaving.error';

export class AspectError extends WeavingError {
  constructor(aspect: AspectType, msg: string) {
    super(`[${aspect[ASPECT_ID_SYMBOL]}]: ${msg}`);
  }
}
