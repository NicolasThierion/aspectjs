import { AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { Aspect } from '@aspectjs/core';

import { Before } from '../../advices/before/before.annotation';
import { ASPECT_PROVIDERS } from '../../aspect/aspect.provider';
import { on } from '../../pointcut/pointcut-expression.factory';
import { PointcutType } from '../../pointcut/pointcut-phase.type';
import { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { weaverContext } from '../../weaver/context/weaver.context.global';
import { After } from '../../advices/after/after.annotation';
import { AdviceEntry } from './advice-entry.model';
import { AdviceRegistry } from './advice.registry';

describe('AdviceRegisrty', () => {
  let adviceReg: AdviceRegistry;
  beforeEach(() => {
    adviceReg = configureTesting(
      weaverContext().addModules({
        providers: ASPECT_PROVIDERS,
      }),
    ).get(AdviceRegistry);
  });

  let Aaspect: any;
  let Baspect: any;
  let Xaspect: any;
  let Yaspect: any;
  let SubAaspect: any;

  let aaspect: any;
  let baspect: any;
  let xaspect: any;
  let yaspect: any;
  let subAaaspect: any;
  let Aannotation: any;
  let Bannotation: any;
  let Xannotation: any;

  beforeEach(() => {
    const factory = new AnnotationFactory('test');
    Aannotation = factory.create();
    Bannotation = factory.create();
    Xannotation = factory.create();
    @Aspect()
    class _AAspect {
      @Before(on.classes.withAnnotations(Aannotation))
      beforeClassA1() {}
      @After(on.classes.withAnnotations())
      afterClassA1() {}
    }
    @Aspect()
    class _BAspect {
      @Before(on.methods.withAnnotations(Bannotation))
      beforeMethodB1() {}
      @After(on.methods.withAnnotations())
      afterMethodB1() {}
    }
    @Aspect()
    class _XAspect {
      @Before(on.parameters.withAnnotations(Xannotation))
      beforeParameterX1() {}
      @After(on.parameters.withAnnotations())
      afterParameterX1() {}
    }

    @Aspect()
    class _YAspect {
      @Before(on.parameters.withAnnotations(Xannotation))
      beforeParameterX1() {}
      @After(on.parameters.withAnnotations())
      afterParameterX1() {}
    }

    class _SubAaspect extends _AAspect {
      @Before(on.classes.withAnnotations(Aannotation))
      override beforeClassA1() {}
      @After(on.parameters.withAnnotations())
      afterClassSubA1() {}
    }
    Aaspect = _AAspect;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Baspect = _BAspect;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Xaspect = _XAspect;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Yaspect = _YAspect;
    SubAaspect = _SubAaspect;
    aaspect = new Aaspect();
    baspect = new Baspect();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    xaspect = new Xaspect();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    yaspect = new Yaspect();
    subAaaspect = new SubAaspect();

    adviceReg.register(aaspect);
    adviceReg.register(baspect);
    adviceReg.register(subAaaspect);
  });

  describe('.select({aspects: <...ASPECTS>})', () => {
    describe('.find()', () => {
      describe('given <...ASPECTS> are not registered aspects', () => {
        it('returns empty iterator', () => {
          expect([
            ...adviceReg
              .select({
                aspects: [Xaspect, Yaspect],
              })
              .find(),
          ]).toEqual([]);
        });
      });

      describe('given <...ASPECTS> are registered aspects', () => {
        describe('and <...ASPECTS> have some advices', () => {
          it('returns an iterator of advices', () => {
            const expected: AdviceEntry[] = [
              { aspect: aaspect, advice: aaspect.beforeClassA1 },
              { aspect: aaspect, advice: aaspect.afterClassA1 },
              { aspect: baspect, advice: baspect.beforeMethodB1 },
              { aspect: baspect, advice: baspect.afterMethodB1 },
            ];

            expect([
              ...adviceReg
                .select({
                  aspects: [Aaspect, Baspect],
                })
                .find(),
            ]).toEqual(expected);
          });
        });

        describe('and <...ASPECTS> have a parent class that declares some advices', () => {
          it('returns an iterator of advices', () => {
            const expected: AdviceEntry[] = [
              { aspect: subAaaspect, advice: subAaaspect.beforeClassA1 },
              { aspect: subAaaspect, advice: subAaaspect.afterClassA1 },
              { aspect: subAaaspect, advice: subAaaspect.afterClassSubA1 },
            ];

            expect([
              ...adviceReg
                .select({
                  aspects: [SubAaspect],
                })
                .find(),
            ]).toEqual(expected);
          });
        });
      });
    });

    describe('.find(<TARGET_TYPE>)', () => {
      describe('given <...ASPECTS> have some <TARGET_TYPE> advices', () => {
        it('returns the iterator of advices', () => {
          const expected: AdviceEntry[] = [
            { aspect: aaspect, advice: aaspect.beforeClassA1 },
            { aspect: aaspect, advice: aaspect.afterClassA1 },
          ];
          expect([
            ...adviceReg
              .select({
                aspects: [Aaspect, Baspect],
              })
              .find(PointcutTargetType.CLASS),
          ]).toEqual(expected);
        });
      });
    });
    describe('.find(<TARGET_TYPE>, <POINTCUT_TYPE>)', () => {
      describe('given <...ASPECTS> have some <TARGET_TYPE> advices', () => {
        it('returns the iterator of advices', () => {
          const expected: AdviceEntry[] = [
            { aspect: aaspect, advice: aaspect.afterClassA1 },
          ];

          expect([
            ...adviceReg
              .select({
                aspects: [Aaspect, Baspect],
              })
              .find(PointcutTargetType.CLASS, PointcutType.AFTER),
          ]).toEqual(expected);
        });
      });
    });
  });

  describe('.select({aspects: <...ASPECTS>}, annotations: <...ANNOTATIONS>)', () => {
    describe('.find()', () => {
      describe('given <...ASPECTS> defines no advices with <...ANNOTATIONS>', () => {
        it('returns empty array', () => {
          expect([
            ...adviceReg
              .select({
                aspects: [Aaspect],
                annotations: [Xannotation],
              })
              .find(),
          ]).toEqual([]);
        });
      });
      describe('given <...ASPECTS> defines some advices with <...ANNOTATIONS>', () => {
        it('returns empty array', () => {
          const expected: AdviceEntry[] = [
            {
              aspect: aaspect,
              advice: aaspect.beforeClassA1,
            },
          ];
          expect([
            ...adviceReg
              .select({
                aspects: [Aaspect, Baspect],
                annotations: [Aannotation, Xannotation],
              })
              .find(),
          ]).toEqual(expected);
        });
      });
    });
  });
});
