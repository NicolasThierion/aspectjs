import { configureAspectTestingContext } from '@aspectjs/core/testing';
import { Aspect } from '../aspect/aspect.annotation';
import { on } from '../pointcut/pointcut-expression.factory';
import type { AdviceRegistry } from './advice.registry';
import { AfterReturn } from './annotations/after-return.annotation';
import { AfterThrow } from './annotations/after-throw.annotation';
import { After } from './annotations/after.annotation';
import { Around } from './annotations/around.annotation';
import { Before } from './annotations/before.annotation';
import { Compile } from './annotations/compile.annotation';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe.each([[Compile, Before, Around, AfterReturn, AfterThrow, After]])(
  `%s() Annotation`,
  (adviceAnnotation) => {
    let adviceReg!: AdviceRegistry;
    beforeEach(() => {
      adviceReg = configureAspectTestingContext().get('adviceRegistry');
      jest.spyOn(adviceReg, 'register');
    });
    describe('on a method', () => {
      describe('when the class has an @Aspect() annotation', () => {
        it('should call AdviceRegistry.register()', () => {
          @Aspect()
          class TestClass {
            @adviceAnnotation(on.class.withAnnotations())
            testCompile() {}
          }
          expect(adviceReg.register).toHaveBeenCalledTimes(1);
        });
      });

      describe('when the class does not have an @Aspect() annotation', () => {
        it('should not call AdviceRegistry.register()', () => {
          class TestClass {
            @adviceAnnotation(on.class.withAnnotations())
            testCompile() {}
          }
          expect(adviceReg.register).not.toHaveBeenCalledTimes(1);
        });
        xdescribe('but parent class is', () => {
          xit('should call AdviceRegistry.register()', () => {});
        });
      });
    });
  },
);
