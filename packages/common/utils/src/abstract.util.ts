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

    if (
      _isAbstractToken(val) &&
      (val as AbstractToken).counter - abstractCounter !== 0
    ) {
      // abstact was used once, as a return value
      return val;
    }

    if (!_abstractThrows || abstractCounter - _abstractCounter === 1) {
      // abstract was used more than once, in case of nested calls
      return val;
    }

    throw new Error(
      '"abstract()" placeholder should only be used as a return value.',
    );
  } finally {
    abstractThrows = _abstractThrows;
  }
};

class AbstractToken {
  constructor(public readonly counter: number) {}
  toSting() {
    return '[ABSTRACT_TOKEN placeholder]';
  }
}

/**
 * Annotating abstract methods is not allowed in TypeScript.
 * Instead, we have to define concrete, empty methods, awaiting for an annotation to actually define its behaviour.
 * However, typescript will throw a compilation error if that method declares a return value but the body is empty.
 * The abstract function is a placeholder that stands for a return value.
 * It will throw if called as is, but it is intended to be bypassed by the action of an annotation.
 *
 * @param T the type of the value to be replaced.
 */
export const abstract = <T extends any>(): T => {
  if (abstractThrows) {
    throw new Error(
      'abstract value has not been superseded by an annotation behavior.',
    );
  }

  return new AbstractToken(++abstractCounter) as any;
};

export const _isAbstractToken = (val: any) => val instanceof AbstractToken;
