import {
  AnnotationRegistry,
  AnnotationTarget,
  AnnotationTargetFactory,
  AnnotationType,
} from '@aspectjs/common';
import {
  ConstructorType,
  defineMetadata,
  getMetadata,
  getPrototype,
  isClassInstance,
} from '@aspectjs/common/utils';

import { AdviceRegistry } from '../advice/registry/advice.registry';
import { WeavingError } from '../errors/weaving.error';
import { WeaverContext } from '../weaver/context/weaver.context';
import { Aspect } from './aspect.annotation';

import type { AspectOptions } from './aspect-options.type';
import { ASPECT_ID_SYMBOL, AspectType } from './aspect.type';
let _globalRegId = 0;

export class AspectRegistry {
  private readonly _ASPECT_OPTIONS_REFLECT_KEY = `@aspectjs/AspectRegistry@${_globalRegId++}`;
  private readonly aspectsMap = new Map<string, AspectType[]>();

  private readonly annotationTargetFactory = this.weaverContext.get(
    AnnotationTargetFactory,
  );

  private readonly adviceReg = this.weaverContext.get(AdviceRegistry);

  constructor(private readonly weaverContext: WeaverContext) {}
  /**
   *
   * An object  is considered an aspect if its class or one of its parent
   * has been annotated with the `@Aspect` annotation,
   * plus it has been registered against this registry.
   * @param aspect
   * @returns true if the given parameter is an aspect
   */
  isAspect(aspect: AspectType): boolean {
    return !!this.__getAspectOptions(aspect);
  }

  getAspectOptions(aspect: AspectType): AspectOptions {
    this._assertIsAspect(aspect);
    return this.__getAspectOptions(aspect)!;
  }

  register(aspect: AspectType, aspectOptions: AspectOptions = {}) {
    const target = this.annotationTargetFactory.of<AspectType>(aspect);
    const [annotation] = this.weaverContext
      .get(AnnotationRegistry)
      .select(Aspect)
      .on({ target })
      .find({ searchParents: true });

    if (!annotation) {
      throw new WeavingError(`${target.label} is not an aspect`);
    } else if (!isClassInstance(aspect)) {
      throw new TypeError(
        `${
          (aspect as any).name ?? aspect
        } is not an aspect instance. Did you forget to call new ? `,
      );
    }

    if (this.isAspect(aspect)) {
      throw new WeavingError(
        `Aspect "${getPrototype(aspect)?.constructor
          ?.name}" has already been registered`,
      );
    }

    aspectOptions = coerceAspectOptions(target, annotation.args[0]);
    const id = getAspectId(aspect);
    const as = this.aspectsMap.get(id) ?? [];
    as.push(aspect);
    this.aspectsMap.set(id, as);
    defineMetadata(
      this._ASPECT_OPTIONS_REFLECT_KEY,
      aspectOptions,
      getPrototype(aspect),
    );
    aspect[ASPECT_ID_SYMBOL] = id;

    this.registerAdvices(aspect);
  }

  getAspects<T = AspectType>(
    aspect?: string | ConstructorType<T>,
  ): AspectType[] {
    return aspect
      ? this.aspectsMap.get(getAspectId(aspect)) ?? []
      : [...this.aspectsMap.values()].flatMap((a) => a);
  }

  private registerAdvices(aspect: AspectType) {
    this.adviceReg.register(aspect);
  }

  private __getAspectOptions(aspect: AspectType): AspectOptions | undefined {
    if (!aspect) {
      return;
    }
    return getMetadata(
      this._ASPECT_OPTIONS_REFLECT_KEY,
      Object.getPrototypeOf(aspect),
    );
  }

  private _assertIsAspect(aspect: AspectType) {
    if (!this.isAspect(aspect)) {
      const proto = Object.getPrototypeOf(aspect);
      throw new TypeError(
        `${proto.constructor.name} is not a registered Aspect`,
      );
    }
  }
}

let _globalAspectId = 0;

function coerceAspectOptions(
  aspectTarget: AnnotationTarget<AnnotationType.CLASS, AspectType>,
  idOrOptions: unknown,
): Required<AspectOptions> {
  const options: AspectOptions =
    typeof idOrOptions === 'object' ? { ...idOrOptions } : {};

  options.id =
    typeof idOrOptions === 'string'
      ? idOrOptions
      : options.id ??
        `${aspectTarget.proto.constructor.name}#${_globalAspectId++}`;
  return options as Required<AspectOptions>;
}

function getAspectId(aspect: AspectType | string): string {
  return typeof aspect === 'string'
    ? aspect
    : Object.getPrototypeOf(aspect).constructor.name;
}
