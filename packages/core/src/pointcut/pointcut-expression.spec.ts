import { AnnotationRef } from '@aspectjs/common';
import { PointcutExpression } from './pointcut-expression.type';
import { PointcutKind } from './pointcut-kind.type';

describe('PointcutExpression', () => {
  describe('.of(exp: string)', () => {
    let kind: PointcutKind;
    const name = '*';
    const annotations = [
      AnnotationRef.of('test:Test'),
      AnnotationRef.of('test2:Test2'),
    ];
    let expression: string;

    function testAttributes(pe: PointcutExpression, testExpr?: string) {
      expect(pe.kind).toEqual(kind);
      expect(pe.name).toEqual(name);
      expect(pe.annotations).toEqual(annotations);
      expect(`${pe}`).toEqual(testExpr ?? expression);
    }
    describe('when parameter is a valid class pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 class *';
        kind = PointcutKind.CLASS;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });

    describe('when parameter is a valid method pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 method *';
        kind = PointcutKind.METHOD;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });

    describe('when parameter is a valid parameter pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 parameter *';
        kind = PointcutKind.PARAMETER;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });

    describe('when parameter is a valid property pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 property *';
        kind = PointcutKind.GET_PROPERTY;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(
          PointcutExpression.of(expression),
          '@test:Test|@test2:Test2 get property *',
        );
      });
    });
    describe('when parameter is a valid property setter pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 set property *';
        kind = PointcutKind.SET_PROPERTY;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });

    describe('when parameter is pointcut expression that targets any', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 any *';
        kind = PointcutKind.ANY;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });
  });
});

export {};
