import { assert } from '@aspectjs/common/utils';

export interface MapperContext {
  typeHint: Function;
  mappers: MappersRegistry;
}
export interface Mapper<T = unknown, U = unknown> {
  accepts(obj: T, context: MapperContext): boolean;
  map(obj: T, context: MapperContext): U;
}

export class MappersRegistry {
  private readonly knownMappers: Map<Function, Mapper> = new Map();
  private readonly mappers: Mapper[] = [];

  constructor(mappersReg?: MappersRegistry) {
    if (mappersReg) {
      this.knownMappers = new Map(mappersReg.knownMappers);
      this.mappers = [...mappersReg.mappers];
    }
  }
  accepts<T>(obj: T, context: MapperContext): boolean {
    return !!this.findMapper(obj, context);
  }
  map<T, U>(obj: T, context: MapperContext): U {
    const mapper = this.findMapper(obj, context);
    if (mapper) {
      return mapper.map(obj, context) as U;
    } else {
      throw new Error(
        `No mapper found for object of type ${
          Object.getPrototypeOf(obj).constructor.name
        }`,
      );
    }
  }

  add(...mappers: Mapper[]) {
    this.mappers.unshift(...mappers);

    // have to refresk all known mappers
    this.knownMappers.clear();

    return this;
  }

  [Symbol.iterator]() {
    return this.mappers[Symbol.iterator]();
  }

  private findMapper<T>(obj: T, context: MapperContext): Mapper | undefined {
    const ctor = Object.getPrototypeOf(obj).constructor;
    let mapper = this.knownMappers.get(ctor);
    if (mapper) {
      assert(
        mapper.accepts(obj, context),
        `Mapper ${mapper.constructor.name} does not accept object of type ${
          Object.getPrototypeOf(obj).constructor.name
        }`,
      );
    } else {
      for (const m of this.mappers) {
        if (m.accepts(obj, context)) {
          this.knownMappers.set(ctor, m);
          mapper = m;
          break;
        }
      }
    }

    return mapper;
  }
}
