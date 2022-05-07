import { assert } from '@aspectjs/common/utils';

export class AnnotationRef {
  public readonly value: string;
  public readonly name: string;
  public readonly groupId: string;

  constructor(ref: string);
  constructor(groupId: string, name: string);
  constructor(groupIdOrRef: string, name?: string) {
    let _groupId: string | undefined;
    let _name: string | undefined;
    if (!name) {
      this.value = groupIdOrRef.replace(/^@/, '');
      const ANNOTATION_REF_REGEX = /(?<groupId>\S+):(?<name>\S+)/;
      const match = ANNOTATION_REF_REGEX.exec(this.value);
      _groupId = match?.groups?.['groupId'];
      _name = match?.groups?.['name'];
    } else {
      this.value = `${groupIdOrRef}:${name}`;
      _name = name;
      _groupId = groupIdOrRef;
    }
    if (!_name) {
      assert(false);
      throw new Error('cannot create annotation without name');
    }

    if (!_groupId) {
      throw new Error('cannot create annotation without groupId');
    }

    this.name = _name;
    this.groupId = _groupId;

    Object.defineProperty(this, Symbol.toPrimitive, {
      enumerable: false,
      value: () => {
        return `@${this.name}`;
      },
    });
  }

  toString(): string {
    return `@${this.groupId}:${this.name}`;
  }
}
