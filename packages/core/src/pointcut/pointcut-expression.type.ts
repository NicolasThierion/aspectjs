import { Annotation, AnnotationRef } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { PointcutTargetType } from './pointcut-target.type';

interface PointcutExpressionInit<
  T extends PointcutTargetType = PointcutTargetType,
> {
  type: T;
  annotations: (AnnotationRef | Annotation)[];
}
const ANNOTATIONS_MATCH = '(?<annotations>(?:@\\S+)*)';
const NAME_MATCH = `(?<name>\\S*)`;

const POINTCUT_REGEXES = {
  [PointcutTargetType.CLASS]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+class\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutTargetType.GET_PROPERTY]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+(?:get\\s+)?property\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutTargetType.SET_PROPERTY]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+(?:set\\s+)property\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutTargetType.METHOD]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+method\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutTargetType.PARAMETER]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+parameter\\s+${NAME_MATCH}\\s*$`,
  ),
  [PointcutTargetType.ANY]: new RegExp(
    `^\\s*${ANNOTATIONS_MATCH}\\s+any\\s+${NAME_MATCH}\\s*$`,
  ),
};

export class PointcutExpression<
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly name: string = '*'; // TODO: Add support for pointcut by symbol name
  readonly type: T;
  readonly annotations: AnnotationRef[] = [];
  private readonly _expr: string;

  constructor(pointcutExpression: PointcutExpressionInit<T>) {
    this.type = pointcutExpression.type;
    this.annotations = pointcutExpression.annotations.map(AnnotationRef.of);

    this._expr = _trimSpaces(
      `${this.annotations.map((a) => `@${a.value}`).join('|')} ${this.type} ${
        this.name
      }`,
    );
  }

  static of<T extends PointcutTargetType>(
    expression: string,
  ): PointcutExpression<T> {
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
      type: type as T,
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
