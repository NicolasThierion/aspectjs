import { assert } from './assert';
import { isUndefined } from './utils';

declare let Reflect: {
  getOwnMetadata(
    key: string | symbol,
    target: object,
    propertyKey?: string,
  ): any;
  defineMetadata(
    key: string | symbol,
    value: any,
    target: object,
    propertyKey?: string,
  ): void;
};

// rough Reflect polyfill
if (!Reflect.getOwnMetadata) {
  const _meta = new Map<object, Map<string, Map<string, any>>>();

  Reflect.getOwnMetadata = function (
    key: string,
    target: object,
    propertyKey?: string,
  ): any {
    return _meta
      .get(target)
      ?.get(key)
      ?.get(propertyKey ?? '');
  };
  Reflect.defineMetadata = function (
    key: string,
    value: any,
    target: object,
    propertyKey?: string,
  ): void {
    const tBucket = _meta.get(target) ?? new Map();
    const kBucket = tBucket.get(key) ?? new Map();

    _meta.set(target, tBucket);
    tBucket.set(key, kBucket);
    kBucket.set(propertyKey ?? '', value);
  };
}

export function defineMetadata(
  key: string,
  value: any,
  target: object,
  propertyKey?: string,
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
  let _propertyKey = propertyKey as string;
  let _valueGenerator = valueGenerator as () => T;
  if (typeof valueGenerator === 'boolean') {
    save = valueGenerator;
  }
  if (typeof propertyKey === 'function') {
    _valueGenerator = propertyKey;
    _propertyKey = '';
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
