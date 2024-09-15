import { TypeHintType } from './type-hint.type';

export interface BodyMetadata<T = unknown> {
  value: T;
  typeHint: TypeHintType<T>;
}
