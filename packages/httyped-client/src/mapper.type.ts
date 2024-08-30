export interface MapperContext {
  typeHint: Function;
}
export interface Mapper<T = unknown, U = unknown> {
  accepts(obj: T, context: MapperContext): boolean;
  map(obj: T, context: MapperContext): U;
}
