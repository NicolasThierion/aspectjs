import { ConstructorType } from '@aspectjs/common/utils';
import { TypeHintType } from './type-hint.type';

export interface MapperContext {
  readonly mappers: MappersRegistry;
  readonly data: Record<string, unknown>;
}
export interface Mapper<T = unknown, U = unknown> {
  /**
   * Hint to set this mapper as a candidate for a given type
   */
  typeHint: TypeHintType | TypeHintType[];
  /**
   * Map an object to a given type.
   * @param obj the object to map
   * @param context the context of the mapper
   */
  map(obj: U, context: MapperContext): T;
}

export class MappersRegistry {
  private readonly mappers: Map<TypeHintType, Mapper> = new Map();

  constructor(mappersReg?: MappersRegistry) {
    if (mappersReg) {
      this.mappers = new Map(mappersReg.mappers);
    }
  }

  add(...mappers: Mapper[]) {
    mappers.forEach((mapper) => {
      [mapper.typeHint].flat().forEach((typeHint) => {
        this.mappers.set(typeHint, mapper);
        if (typeof typeHint === 'function') {
          this.mappers.set(typeHint.name, mapper);
        }
      });
    });

    return this;
  }

  [Symbol.iterator]() {
    return this.mappers[Symbol.iterator]();
  }

  findMapper<T, U extends T>(typeHint: TypeHintType<T>): Mapper<T> | undefined {
    let mapper = this.mappers.get(typeHint) as Mapper<T, U> | undefined;
    if (!mapper && typeof (typeHint as ConstructorType<any>) === 'function') {
      // try to lookup mappers by type name
      mapper = this._findMapperByCtor<T, U>(typeHint as ConstructorType<T>);
    }

    return mapper;
  }

  private _findMapperByCtor<T, U>(
    ctor: ConstructorType<T>,
  ): Mapper<T, U> | undefined {
    const mapper = (this.mappers.get(ctor) ??
      this.mappers.get(ctor.name)) as Mapper<T, U>;

    if (!mapper) {
      const parent = ctor.prototype
        ? Object.getPrototypeOf(ctor.prototype)?.constructor
        : null;
      if (parent && parent !== Object) {
        return this._findMapperByCtor(parent);
      }
    }

    return mapper;
  }
}
