export interface Mapper<T = unknown, U = unknown> {
  accepts(obj: T): boolean;
  map(obj: T): U;
}
