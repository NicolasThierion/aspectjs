import { assert } from '@aspectjs/common/utils';
import type { ConstructorType } from 'packages/common/src/constructor.type';
import type { AspectOptions } from './aspect-options.type';
import {
  isAspect,
  _assertIsAspect,
  _getAspectOptions,
  _markAsAspect,
} from './aspect-utils';
import type { AspectType } from './aspect.type';

interface AspectRegEntry<T extends AspectType = AspectType> {
  aspect: ConstructorType<T>;
  options: AspectOptions;
}

export class AspectRegistry {
  private readonly _aspects: Map<string, AspectRegEntry> = new Map();

  /**
   * Register aspects and its advices.
   * @param entries - The aspects to register
   */
  register(...entries: AspectRegEntry[]) {
    (entries ?? []).forEach((entry) => {
      _assertIsAspect(entry.aspect);
      assert(!!entry.options.id);

      const id = entry.options.id!;
      const oldAspect = this._aspects.get(id);
      if (!!oldAspect) {
        console.warn(
          `Aspect ${entry.aspect.constructor.name} overrides aspect "${
            oldAspect?.constructor.name ?? 'unknown'
          }" already registered for id ${id}`,
        );
      }
      this._aspects.set(id, entry);
    });
  }

  /**
   * Find an aspect among registered aspect given its aspect id or constructor.
   * @param aspect - the aspect id or constructor to find.
   * @returns The aspect if registered, undefined otherwise
   */
  find<T extends AspectType>(
    aspect: string | (new () => T),
  ): AspectRegEntry<T> | undefined {
    if (typeof aspect === 'string') {
      return this._aspects.get(aspect) as AspectRegEntry<T>;
    } else if (isAspect(aspect)) {
      return this._aspects.get(
        _getAspectOptions(aspect).id!,
      ) as AspectRegEntry<T>;
    }
    return;
  }

  /**
   * Find an aspect among registered aspect given its aspect id or constructor.
   * @param aspect - the aspect id or constructor to find.
   * @returns The aspect if registered
   * @throws throw if the aspect could not be found
   */
  get<T extends AspectType>(
    aspect: string | (new () => T),
  ): AspectRegEntry<T> | undefined {
    const res = this.find(aspect);

    if (!aspect) {
      if (typeof aspect !== 'string') {
        // let assert throw
        _assertIsAspect(aspect);
      } else {
        throw new Error(`No aspect registered with id ${aspect}`);
      }
    }

    return res;
  }
}
