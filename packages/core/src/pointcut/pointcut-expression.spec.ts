import { AnnotationRef } from '@aspectjs/common';
import { PointcutExpression } from './pointcut-expression.type';
import { PointcutTargetType } from './pointcut-target.type';

describe('PointcutExpression', () => {
  describe('.of(exp: string)', () => {
    let type: PointcutTargetType;
    let name = '*';
    let annotations = [
      new AnnotationRef('test:Test'),
      new AnnotationRef('test2:Test2'),
    ];
    let expression: string;

    function testAttributes(pe: PointcutExpression, testExpr?: string) {
      expect(pe.type).toEqual(type);
      expect(pe.name).toEqual(name);
      expect(pe.annotations).toEqual(annotations);
      expect(`${pe}`).toEqual(testExpr ?? expression);
    }
    describe('when parameter is a valid class pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 class *';
        type = PointcutTargetType.CLASS;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });

    describe('when parameter is a valid method pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 method *';
        type = PointcutTargetType.METHOD;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });

    describe('when parameter is a valid parameter pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 parameter *';
        type = PointcutTargetType.PARAMETER;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });

    describe('when parameter is a valid property pointcut expression', () => {
      beforeEach(() => {
        expression = '@test:Test|@test2:Test2 property *';
        type = PointcutTargetType.GET_PROPERTY;
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
        type = PointcutTargetType.SET_PROPERTY;
      });
      it('returns a class PointcutExpression with correct attributes', () => {
        testAttributes(PointcutExpression.of(expression));
      });
    });
  });
});

export {};
