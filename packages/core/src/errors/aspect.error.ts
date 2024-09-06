import { AspectType, getAspectMetadata } from '../aspect/aspect.type';
import { WeavingError } from './weaving.error';

export class AspectError extends WeavingError {
  constructor(aspect: AspectType, msg: string) {
    super(`[${getAspectMetadata(aspect).id}]: ${msg}`);
  }
}
