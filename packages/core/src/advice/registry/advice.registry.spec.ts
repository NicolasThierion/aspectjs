import { AnnotationFactory } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { Aspect } from '@aspectjs/core';
import { AdviceType } from './../advice-type.type';

import { After } from '../../advices/after/after.annotation';
import { Before } from '../../advices/before/before.annotation';
import { on } from '../../pointcut/pointcut-expression.factory';
import { JoinpointType } from '../../pointcut/pointcut-target.type';
import { WeaverModule } from '../../weaver/weaver.module';
import { AdviceRegistry } from './advice.registry';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('AdviceRegisrty', () => {
  let adviceReg: AdviceRegistry;
  beforeEach(() => {
    adviceReg = configureTesting(WeaverModule).get(AdviceRegistry);
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
  let Yannotation: any;

  beforeEach(() => {
    const factory = new AnnotationFactory('test');
    Aannotation = factory.create('Aannotation');
    Bannotation = factory.create('Bannotation');
    Xannotation = factory.create('Xannotation');
    Yannotation = factory.create('Yannotation');
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
      @Before(on.parameters.withAnnotations(Yannotation))
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
    Baspect = _BAspect;
    Xaspect = _XAspect;
    Yaspect = _YAspect;
    SubAaspect = _SubAaspect;
    aaspect = new Aaspect();
    baspect = new Baspect();
    xaspect = new Xaspect();
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
            const expected = [
              { aspect: aaspect, advice: 'beforeClassA1' },
              { aspect: aaspect, advice: 'afterClassA1' },
              { aspect: baspect, advice: 'beforeMethodB1' },
              { aspect: baspect, advice: 'afterMethodB1' },
            ];

            expect(
              [
                ...adviceReg
                  .select({
                    aspects: [Aaspect, Baspect],
                  })
                  .find(),
              ].map(({ aspect, advice }) => {
                return {
                  aspect,
                  advice: advice.name,
                };
              }),
            ).toEqual(expected);
          });
        });

        describe('and <...ASPECTS> have a parent class that declares some advices', () => {
          it('returns an iterator of advices', () => {
            const expected = [
              { aspect: subAaaspect, advice: 'beforeClassA1' },
              { aspect: subAaaspect, advice: 'afterClassA1' },
              { aspect: subAaaspect, advice: 'afterClassSubA1' },
            ];

            expect(
              [
                ...adviceReg
                  .select({
                    aspects: [SubAaspect],
                  })
                  .find(),
              ].map(({ aspect, advice }) => {
                return {
                  aspect,
                  advice: advice.name,
                };
              }),
            ).toEqual(expected);
          });
        });
      });
    });

    describe('.find(<TARGET_TYPE>)', () => {
      describe('given <...ASPECTS> have some <TARGET_TYPE> advices', () => {
        it('returns the iterator of advices', () => {
          const expected = [
            { aspect: aaspect, advice: 'beforeClassA1' },
            { aspect: aaspect, advice: 'afterClassA1' },
          ];
          expect(
            [
              ...adviceReg
                .select({
                  aspects: [Aaspect, Baspect],
                })
                .find([JoinpointType.CLASS]),
            ].map(({ aspect, advice }) => {
              return {
                aspect,
                advice: advice.name,
              };
            }),
          ).toEqual(expected);
        });
      });
    });
    describe('.find(<TARGET_TYPE>, <POINTCUT_TYPE>)', () => {
      describe('given <...ASPECTS> have some <TARGET_TYPE> advices', () => {
        it('returns the iterator of advices', () => {
          const expected = [{ aspect: aaspect, advice: 'afterClassA1' }];

          expect(
            [
              ...adviceReg
                .select({
                  aspects: [Aaspect, Baspect],
                })
                .find([JoinpointType.CLASS], [AdviceType.AFTER]),
            ].map(({ aspect, advice }) => {
              return {
                aspect,
                advice: advice.name,
              };
            }),
          ).toEqual(expected);
        });
      });
    });
  });

  describe('.select({aspects: <...ASPECTS>}, annotations: <...ANNOTATIONS>)', () => {
    describe('.find()', () => {
      describe('given <...ASPECTS> defines no advices with <...ANNOTATIONS>', () => {
        it('returns only advices with pointcut on all annotations', () => {
          expect(
            [
              ...adviceReg
                .select({
                  aspects: [Aaspect],
                  annotations: [Xannotation],
                })
                .find(),
            ].map(({ aspect, advice }) => {
              return {
                aspect,
                advice: advice.name,
              };
            }),
          ).toEqual([
            {
              aspect: aaspect,
              advice: 'afterClassA1',
            },
          ]);
        });
      });
      describe('given <...ASPECTS> defines some advices with <...ANNOTATIONS>', () => {
        it('returns advices with pointcut on those annotations', () => {
          expect(
            [
              ...adviceReg
                .select({
                  aspects: [Aaspect, Baspect],
                  annotations: [Aannotation, Xannotation],
                })
                .find(),
            ].map(({ aspect, advice }) => {
              return {
                aspect,
                advice: advice.name,
              };
            }),
          ).toEqual([
            {
              aspect: aaspect,
              advice: 'beforeClassA1',
            },
            { aspect: aaspect, advice: 'afterClassA1' },
            { aspect: baspect, advice: 'afterMethodB1' },
          ]);
        });
      });
    });
  });

  describe('.select({annotations}: <...ANNOTATIONS>})', () => {
    describe('.find()', () => {
      it('returns all advices that uses the given annotations', () => {
        const advices = [
          ...adviceReg
            .select({
              annotations: [Aannotation, Xannotation],
            })
            .find(),
        ].map(({ aspect, advice }) => {
          return {
            aspect,
            advice: advice.name,
          };
        });
        expect(advices).toContainEqual({
          aspect: aaspect,
          advice: 'beforeClassA1',
        });
        expect(advices).toContainEqual({
          aspect: aaspect,
          advice: 'afterClassA1',
        });
        expect(advices).toContainEqual({
          aspect: baspect,
          advice: 'afterMethodB1',
        });
        expect(advices).toContainEqual({
          aspect: subAaaspect,
          advice: 'beforeClassA1',
        });
        expect(advices).toContainEqual({
          aspect: subAaaspect,
          advice: 'afterClassSubA1',
        });

        expect(advices).not.toContainEqual({
          aspect: baspect,
          advice: 'beforeMethodB1',
        });
      });
    });
  });
});
