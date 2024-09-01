import { _AbstractTokenImpl } from './abstract-token-impl.type';

let abstractThrows = true;
let abstractCounter = 0;
/**
 * Disables errors when calling ${@link abstract} method.
 * @param receipe the function to be executed without throwing an error in case ${@link abstract} method is called.
 * @returns
 */
export const _defuseAbstract = (receipe: () => {}) => {
  const _abstractThrows = abstractThrows;
  const _abstractCounter = abstractCounter;
  abstractThrows = false;
  try {
    const val = receipe();

    if (abstractCounter === _abstractCounter) {
      // abstract not used
      return val;
    }

    const multipleAbstractCalls =
      (_isAbstractToken(val) &&
        (val as _AbstractTokenImpl).counter - abstractCounter !== 0) ||
      (_abstractThrows && abstractCounter - _abstractCounter !== 1);
    if (multipleAbstractCalls) {
      throw new Error(
        '"abstract()" placeholder should only be used as a return value.',
      );
    }

    return val;
  } finally {
    abstractThrows = _abstractThrows;
  }
};

/**
 * Annotating abstract methods is not allowed in TypeScript.
 * Instead, we have to define concrete, empty methods, awaiting for an annotation to actually define its behaviour.
 * However, typescript will throw a compilation error if that method declares a return value but the body is empty.
 * The abstract function is a placeholder that stands for a return value.
 * It will throw if called as is, but it is intended to be bypassed by the action of an annotation.
 *
 * @param T the type of the value to be replaced.
 */
export const abstract = <T extends any>(template?: T): T => {
  if (abstractThrows) {
    throw new Error(
      'abstract value has not been superseded by an annotation behavior.',
    );
  }

  return new _AbstractTokenImpl<T>(++abstractCounter, template) as any;
};

export const _isAbstractToken = (val: any) => val instanceof _AbstractTokenImpl;
