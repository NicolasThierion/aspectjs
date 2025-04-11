import { assert } from './assert.util';
import { defineMetadata, getMetadata, getMetadataKeys } from './meta.util';

/**
 * @internal
 */
export const _copyPropsAndMeta = <T extends {} = any>(
  target: T,
  source: T,
  propertyKeys: (string | symbol)[] = [],
) => {
  const valueType = typeof source;

  assert(valueType === 'object' || valueType === 'function');
  if (valueType === 'object' || valueType === 'function') {
    // copy static props
    Object.defineProperties(
      target,
      Object.entries(Object.getOwnPropertyDescriptors(source))
        .filter(([name]) => {
          const ownDescriptor = Object.getOwnPropertyDescriptor(target, name);

          return !ownDescriptor || ownDescriptor.configurable;
        })
        .reduce(
          (descriptors, [name, descriptor]) => ({
            ...descriptors,
            [name]: descriptor,
          }),
          {},
        ),
    );

    getMetadataKeys(source)
      .map((key) => [key, getMetadata(key, source)] as [string, any])
      .forEach(([key, value]) => {
        defineMetadata(key, value, target);
      });

    propertyKeys.forEach((pk) => {
      getMetadataKeys(source, pk)
        .map((key) => [key, getMetadata(key, source, pk)] as [string, any])
        .forEach(([key, value]) => {
          defineMetadata(key, value, target, pk);
        });
    });
  }
};
