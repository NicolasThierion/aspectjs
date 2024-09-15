import { Annotation, AnnotationRef } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { PointcutKind } from './pointcut-kind.type';

interface PointcutExpressionInit<T extends PointcutKind = PointcutKind> {
  kind: T;
  annotations: (AnnotationRef | Annotation)[];
}
const ANNOTATIONS_MATCH = '(?<annotations>(?:@\\S+)*)';
const NAME_MATCH = `(?<name>\\S*)`;

const POINTCUT_REGEXES = {
  [PointcutKind.CLASS]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+class\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutKind.GET_PROPERTY]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+(?:get\\s+)?property\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutKind.SET_PROPERTY]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+(?:set\\s+)property\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutKind.METHOD]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+method\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutKind.PARAMETER]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+parameter\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutKind.ANY]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+any\\s+${NAME_MATCH}\\s*$`,
  ),
};

export class PointcutExpression<T extends PointcutKind = PointcutKind> {
  readonly name: string = '*'; // TODO: Add support for pointcut by symbol name
  readonly kind: T;
  readonly annotations: AnnotationRef[] = [];
  private readonly _expr: string;

  constructor(pointcutExpression: PointcutExpressionInit<T>) {
    this.kind = pointcutExpression.kind;
    this.annotations = pointcutExpression.annotations.map(AnnotationRef.of);

    this._expr = _trimSpaces(
      `${this.annotations.map((a) => `@${a.value}`).join('|')} ${this.kind} ${
        this.name
      }`,
    );
  }

  static of<T extends PointcutKind>(expression: string): PointcutExpression<T> {
    const [type, match] =
      Object.entries(POINTCUT_REGEXES)
        .map(([t, r]) => [t, r.exec(expression)] as [string, RegExpExecArray])
        .filter(([_t, r]) => !!r)[0] ?? [];

    if (!match?.groups) {
      throw new TypeError(
        `expression ${expression} not recognized as valid pointcut expression`,
      );
    }

    const annotations = match.groups['annotations'];
    const name = match.groups['name'];

    assert(!!annotations, 'only annotation pointcuts are supported');
    assert(name === '*', 'name matching is not supported');

    assert(!!match.groups['name'], 'only annotation pointcuts are supported');
    return new PointcutExpression<T>({
      kind: type as T,
      annotations: annotations!
        .split('|')!
        .map((a) => AnnotationRef.of(_trimSpaces(a))),
    });
  }
  [Symbol.toPrimitive] = this.toString;
  toString(): string {
    return this._expr;
  }
}

function _trimSpaces(s: string) {
  return s.replace(/\s+/, ' ');
}
