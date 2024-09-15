import { Annotation, AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { AfterReturn } from '../advices/after-return/after-return.annotation';
import { AfterThrow } from '../advices/after-throw/after-throw.annotation';
import { After } from '../advices/after/after.annotation';
import { Around } from '../advices/around/around.annotation';
import { Before } from '../advices/before/before.annotation';
import { Compile } from '../advices/compile/compile.annotation';
import { Aspect } from '../aspect/aspect.annotation';
import { JitWeaver } from '../jit/jit-weaver';
import { on } from '../pointcut/pointcut-expression.factory';
import { WeaverModule } from '../weaver/weaver.module';
import { AdviceContext } from './advice.context';

describe('argument (ctxt: AdviceContext)', () => {
  describe.each([Compile, Before, After, AfterReturn, AfterThrow, Around])(
    `of a %s advice`,
    (annotation) => {
      let aAdvice = jest.fn();
      let joinpoint = jest.fn();

      let A: Annotation;
      let B: Annotation;
      beforeEach(() => {
        const weaver = configureTesting(WeaverModule).get(JitWeaver);
        const af = new AnnotationFactory('test');
        A = af.create('A');
        B = af.create('B');

        aAdvice = jest.fn();
        joinpoint = jest.fn();

        if (annotation === AfterThrow) {
          joinpoint = jest.fn(() => {
            throw new Error('advice error');
          });
        }
        @Aspect()
        class AAspect {
          @annotation(on.any.withAnnotations(A))
          adviceA(ctxt: AdviceContext) {
            aAdvice(ctxt);
          }
        }

        weaver.enable(new AAspect());
      });

      describe('ctxt.annotations', () => {
        it('contains the annotations of the target', () => {
          @A()
          @B()
          class X {
            constructor() {
              joinpoint();
            }
          }

          if (annotation !== Compile) {
            expect(aAdvice).not.toHaveBeenCalled();
          }
          new X();
          expect(aAdvice).toHaveBeenCalled();
          const ctxt: AdviceContext = aAdvice.mock.calls[0]![0];
          const annotations = ctxt.annotations().find();
          expect(annotations.length).toEqual(2);
          expect(annotations.map((a) => `${a.ref.name}`)).toEqual(
            expect.arrayContaining(['A', 'B']),
          );
        });

        it('contains the annotations of the parent target', () => {
          @B()
          class X {}

          @A()
          class Y extends X {
            constructor() {
              super();
              joinpoint();
            }
          }

          if (annotation !== Compile) {
            expect(aAdvice).not.toHaveBeenCalled();
          }
          new Y();
          expect(aAdvice).toHaveBeenCalled();
          const ctxt: AdviceContext = aAdvice.mock.calls[0]![0];
          const annotations = ctxt.annotations().find();
          expect(annotations.length).toEqual(2);
          expect(annotations.map((a) => `${a.ref.name}`)).toEqual(
            expect.arrayContaining(['A', 'B']),
          );
        });

        if (annotation !== Compile) {
          // can't evaluate sub types for @Compile
          it('contains the annotations of the actual child target', () => {
            @A()
            class X {}

            @B()
            class Y extends X {
              constructor() {
                super();
                joinpoint();
              }
            }

            if (annotation !== Compile) {
              expect(aAdvice).not.toHaveBeenCalled();
            }
            new Y();
            expect(aAdvice).toHaveBeenCalled();
            const ctxt: AdviceContext = aAdvice.mock.calls[0]![0];
            const annotations = ctxt.annotations().find();
            expect(annotations.length).toEqual(2);
            expect(annotations.map((a) => `${a.ref.name}`)).toEqual(
              expect.arrayContaining(['A', 'B']),
            );
          });
        }
      });
    },
  );
});
