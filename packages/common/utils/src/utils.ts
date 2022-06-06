import type { AnnotationRef } from 'packages/common/src/annotation/annotation-ref';
import type { Annotation } from '../../src/annotation/annotation.types';

export function getPrototype(
  target: Record<string, any> | Function,
): Record<string, any> & { constructor?: new (...args: any[]) => any } {
  if (isFunction(target)) {
    return target.prototype;
  } else if (target === null || target === undefined) {
    return target as any;
  }
  return target.hasOwnProperty('constructor')
    ? target
    : Object.getPrototypeOf(target);
}

export function isAnnotation(obj: unknown): obj is Annotation {
  return (
    typeof obj === 'function' &&
    typeof (obj as Annotation).ref?.groupId === 'string' &&
    typeof (obj as Annotation).ref?.name === 'string'
  );
}

export function getAnnotationRef(
  obj: Annotation | AnnotationRef,
): AnnotationRef {
  return (obj as Annotation)?.ref ?? obj;
}

export function isFunction(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && !(value instanceof Array);
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

export function isEmpty(value: unknown[]): boolean {
  return value.length === 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(obj: any): obj is Promise<unknown> {
  return isFunction(obj?.then);
}
