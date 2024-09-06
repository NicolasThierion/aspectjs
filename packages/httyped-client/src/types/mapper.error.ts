import { TypeHintType } from './type-hint.type';

/**
 * Error that is thrown when something unexpected happens while mapping a Request Body or a Response Body.
 */
export class MapperError extends Error {
  constructor(
    readonly value: any,
    readonly typeHint: TypeHintType | TypeHintType[] | undefined,
    message: string,
  ) {
    super(message);
  }
}
