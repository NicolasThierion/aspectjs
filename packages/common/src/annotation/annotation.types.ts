/* eslint-disable @typescript-eslint/ban-types */
import { assert } from '../utils/assert';

export enum AnnotationType {
  CLASS = 0b0001,
  PROPERTY = 0b0010,
  METHOD = 0b0100,
  PARAMETER = 0b1000,
  ANY = 0b1111,
}

export class AnnotationRef {
  public readonly ref: string;
  public readonly name: string;
  public readonly groupId: string;

  constructor(ref: string);
  constructor(groupId: string, name: string);
  constructor(groupIdOrRef: string, name?: string) {
    let _groupId: string | undefined;
    let _name: string | undefined;
    if (!name) {
      this.ref = groupIdOrRef;
      const ANNOTATION_REF_REGEX = /(?<groupId>\S+):(?<name>\S+)/;
      const match = ANNOTATION_REF_REGEX.exec(this.ref);
      _groupId = match?.groups?.['groupId'];
      _name = match?.groups?.['name'];
    } else {
      this.ref = `${groupIdOrRef}:${name}`;
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

export type AnnotationStub<T extends AnnotationType = AnnotationType> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Decorator<T> | void;

export type DecoratorFactory<
  S extends AnnotationStub,
  T extends AnnotationType = AnnotationType
> = (...args: Parameters<S & AnnotationRef>) => Decorator<T>;

/**
 * An Annotation is an EcmaScript decorator with no behavior.
 */
export type Annotation<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub<T> = AnnotationStub<T>
> = AnnotationRef & ((...args: Parameters<S & AnnotationRef>) => Decorator<T>);

export type Decorator<T extends AnnotationType = AnnotationType> =
  T extends AnnotationType.CLASS
    ? <TFunction extends Function>(target: TFunction) => TFunction
    : T extends AnnotationType.METHOD
    ? <X>(
        target: Object,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<X>
      ) => TypedPropertyDescriptor<T>
    : T extends AnnotationType.PARAMETER
    ? ParameterDecorator
    : T extends AnnotationType.PROPERTY
    ? PropertyDecorator
    : ClassDecorator | MethodDecorator | ParameterDecorator | PropertyDecorator;

export type AnyDecorator = ClassDecorator &
  MethodDecorator &
  ParameterDecorator &
  PropertyDecorator;
