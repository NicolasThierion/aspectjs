import {
  getPrototype,
  getMetadata,
  defineMetadata,
} from '@aspectjs/common/utils';
import type { ConstructorType } from 'packages/common/src/constructor.type';
import type { AspectOptions } from './aspect-options.type';
import type { AspectType } from './aspect.type';

const _ASPECT_OPTIONS_REFLECT_KEY = 'aspectjs::Aspect.options';

export function isAspect(aspect: object | Function) {
  return !!__getAspectOptions(aspect);
}

/**
 * @internal
 * @param aspect
 */
export function _assertIsAspect(aspect: object | Function) {
  if (!isAspect(aspect)) {
    const proto = getPrototype(aspect);
    throw new TypeError(`${proto.constructor.name} is not an Aspect`);
  }
}

/**
 * @internal
 * @param aspect
 * @param aspectOptions
 */
export function _markAsAspect(
  aspect: ConstructorType<AspectType>,
  aspectOptions: AspectOptions,
) {
  defineMetadata(
    _ASPECT_OPTIONS_REFLECT_KEY,
    aspectOptions,
    getPrototype(aspect),
  );
}

/**
 * @internal
 * @param aspect
 * @returns
 */
export function _getAspectOptions(aspect: object | Function): AspectOptions {
  _assertIsAspect(aspect);
  return __getAspectOptions(aspect)!;
}

function __getAspectOptions(
  aspect: object | Function,
): AspectOptions | undefined {
  if (!aspect) {
    return;
  }
  const proto = getPrototype(aspect);

  return proto ? getMetadata(_ASPECT_OPTIONS_REFLECT_KEY, proto) : undefined;
}
