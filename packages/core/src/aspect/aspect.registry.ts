import { AnnotationTargetFactory } from '@aspectjs/common';
import {
  assert,
  ConstructorType,
  defineMetadata,
  getMetadata,
  getPrototype,
  isClassInstance,
} from '@aspectjs/common/utils';

import { AdviceRegistry } from '../advice/registry/advice.registry';
import { WeavingError } from '../errors/weaving.error';
import { WeaverContext } from '../weaver/context/weaver.context';

import { AspectType, getAspectMetadata, isAspect } from './aspect.type';
let _globalRegId = 0;

export class AspectRegistry {
  private readonly _ASPECT_REGSTERED_REFLECT_KEY = `@aspectjs/AspectRegistry@${_globalRegId++}`;
  private readonly aspectsMap = new Map<string, AspectType>();

  private readonly annotationTargetFactory: AnnotationTargetFactory;
  private readonly adviceReg: AdviceRegistry;

  constructor(private readonly weaverContext: WeaverContext) {
    this.annotationTargetFactory = this.weaverContext.get(
      AnnotationTargetFactory,
    );

    this.adviceReg = this.weaverContext.get(AdviceRegistry);
  }
  /**
   *
   * An object is considered a registered aspect if its class or one of its parent
   * has been annotated with the `@Aspect` annotation,
   * plus it has been registered against this registry.
   * @param aspect
   * @returns true if the given parameter is an aspect
   */
  isRegistered(aspect: AspectType): boolean {
    return !!this.__isAspectRegistered(aspect);
  }

  register(aspect: AspectType) {
    if (!isAspect(aspect)) {
      const target = this.annotationTargetFactory.of<AspectType>(aspect);
      throw new WeavingError(`${target.label} is not an aspect`);
    } else if (!isClassInstance(aspect)) {
      throw new TypeError(
        `${
          (aspect as any).name ?? aspect
        } is not an aspect instance. Did you forget to call new ? `,
      );
    }

    if (this.isRegistered(aspect)) {
      throw new WeavingError(
        `Aspect "${getPrototype(aspect)?.constructor
          ?.name}" has already been registered`,
      );
    }

    const aspectOptions = getAspectMetadata(aspect);
    this.__defineRegistered(aspect);

    const id = aspectOptions.id;
    assert(!!id, 'Aspect options must have an id');
    const as = this.aspectsMap.get(id);
    if (as) {
      this.adviceReg.unregister(id);
    }
    this.aspectsMap.set(id, aspect);

    this.adviceReg.register(aspect);
  }

  getAspect<T = unknown>(
    aspect: string | ConstructorType<T>,
  ): (T & AspectType) | undefined {
    return this.aspectsMap.get(getAspectId(aspect)) as
      | (T & AspectType)
      | undefined;
  }

  getAspects(): AspectType[] {
    return [...this.aspectsMap.values()].flatMap((a) => a);
  }

  private __isAspectRegistered(aspect: AspectType) {
    return getMetadata<boolean>(this._ASPECT_REGSTERED_REFLECT_KEY, aspect);
  }
  private __defineRegistered(aspect: AspectType) {
    return defineMetadata(this._ASPECT_REGSTERED_REFLECT_KEY, true, aspect);
  }
}

function getAspectId(aspect: AspectType | string): string {
  return typeof aspect === 'string' ? aspect : getAspectMetadata(aspect).id;
}
