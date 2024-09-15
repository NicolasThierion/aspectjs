import { assert } from '@aspectjs/common/utils';
import { isUndefined } from './utils';

declare let Reflect: {
  getOwnMetadata(
    key: string | symbol,
    target: object,
    propertyKey?: string | symbol,
  ): any;
  defineMetadata(
    key: string | symbol,
    value: any,
    target: object,
    propertyKey?: string | symbol,
  ): void;

  getOwnMetadataKeys(target: any, propertyKey?: string | symbol): string[];
};

// rough Reflect polyfill
if (
  !Reflect.getOwnMetadata ||
  !Reflect.defineMetadata ||
  !Reflect.getOwnMetadataKeys
) {
  const _meta = new Map<
    any,
    Map<string | symbol | undefined, Map<string, any>>
  >();

  Reflect.getOwnMetadata = function (
    key: string,
    target: object,
    propertyKey?: string,
  ): any {
    return _meta.get(target)?.get(propertyKey)?.get(key);
  };
  Reflect.defineMetadata = function (
    key: string,
    value: any,
    target: object,
    propertyKey?: string,
  ): void {
    const tBucket = _meta.get(target) ?? new Map();
    const pkBucket = tBucket.get(propertyKey) ?? new Map();

    _meta.set(target, tBucket);
    tBucket.set(propertyKey, pkBucket);
    pkBucket.set(key, value);
  };

  Reflect.getOwnMetadataKeys = function (
    target: object,
    propertyKey?: string | symbol,
  ): string[] {
    const pkBucket = _meta.get(target)?.get(propertyKey) ?? new Map();

    return [...pkBucket.keys()];
  };
}

export function getMetadataKeys(
  target: object,
  propertyKey?: string | symbol,
): string[] {
  return Reflect.getOwnMetadataKeys(target, propertyKey);
}

export function defineMetadata(
  key: string,
  value: any,
  target: object,
  propertyKey?: string | symbol,
): void;

export function defineMetadata(
  key: string,
  value: any,
  target: object,
  propertyKey?: string | symbol,
) {
  return Reflect.defineMetadata(key, value, target, propertyKey);
}

export function getMetadata<T>(
  key: string | symbol,
  target: object,
  valueGenerator?: () => T,
  save?: boolean,
): T;

export function getMetadata<T>(
  key: string | symbol,
  target: object,
  propertyKey: string | symbol,
  valueGenerator?: () => T,
  save?: boolean,
): T;
export function getMetadata<T>(
  key: string | symbol,
  target: object,
  propertyKey?: string | symbol | (() => T),
  valueGenerator?: (() => T) | boolean,
  save = true,
): T {
  let _propertyKey = propertyKey as string | symbol | undefined;
  let _valueGenerator = valueGenerator as () => T | void;
  if (typeof valueGenerator === 'boolean') {
    save = valueGenerator;
  }
  if (typeof propertyKey === 'function') {
    _valueGenerator = propertyKey;
    _propertyKey = undefined;
  }
  _valueGenerator = _valueGenerator ?? (() => {});

  assert(!!target);
  let value = Reflect.getOwnMetadata(key, target, _propertyKey);

  if (isUndefined(value)) {
    value = _valueGenerator?.();
    if (save && value !== undefined) {
      Reflect.defineMetadata(key, value, target, _propertyKey);
    }
  }

  return value;
}
