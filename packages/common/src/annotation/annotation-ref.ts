import { assert } from '@aspectjs/common/utils';
import { Annotation } from './annotation.types';

/**
 * An annotation is identified by its name and its group id.
 * An AnnotationRef represents the identity of an annotation.
 */
export class AnnotationRef {
  /**
   * The value of the annotation reference.
   */
  public readonly value: string;
  /**
   * The name of the referenced annotation.
   */
  public readonly name: string;
  /**
   * The group id of the referenced annotation.
   */
  public readonly groupId: string;

  /**
   * @internal
   * @param ref
   */
  constructor(ref: string);
  /**
   * @internal
   * @param groupId
   * @param name
   */
  constructor(groupId: string, name: string);
  /**
   * @internal
   * @param groupIdOrRef
   * @param name
   */
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
  }

  /**
   * Get the string representation of the annotation in the format: `@<groupId>:<name>`
   * @returns The string representation of the annotation.
   */
  toString(): string {
    return `@${this.groupId}:${this.name}`;
  }

  /**
   * Create a new Annotation Reference out of an Annotation, a string, or an AnnotationRef.
   * @param obj
   * @returns
   */
  static of(obj: Annotation | AnnotationRef | string): AnnotationRef {
    if (typeof obj === 'string') {
      return new AnnotationRef(obj);
    }
    return (obj as Annotation)?.ref ?? obj;
  }
}
