import { ConstructorType, Prototype } from '@aspectjs/common/utils';
import { AnnotationTarget } from './annotation-target';

/**
 * @internal
 */
export function _findPropertyDescriptor(
  obj: Prototype | ConstructorType,
  propertyKey: string | symbol,
): PropertyDescriptor | undefined {
  if (!obj) {
    return;
  }
  const descriptor = Object.getOwnPropertyDescriptor(obj, propertyKey);
  if (descriptor) {
    return descriptor;
  }

  return _findPropertyDescriptor(Object.getPrototypeOf(obj), propertyKey);
}

export function defuseAdvices<R = unknown>(
  target: AnnotationTarget,
  fn: () => R,
) {
  try {
    target.defineMetadata('@ajs:defuseAdvices', true);
    return fn();
  } finally {
    target.defineMetadata('@ajs:defuseAdvices', false);
  }
}
