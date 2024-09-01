import {
  AnnotationFactory,
  AnnotationTargetFactory,
  AnnotationType,
} from '@aspectjs/common';
import {
  ReflectTestingContext,
  configureTesting,
} from '@aspectjs/common/testing';

import { Aspect } from '../aspect/aspect.annotation';
import { WeavingError } from '../errors/weaving.error';
import { on } from '../pointcut/pointcut-expression.factory';
import { Before, Compile } from '../public_api';
import { _BindableAnnotationTarget } from '../utils/bindable-annotation-target';
import { WeaverModule } from '../weaver/weaver.module';
import { JitWeaver } from './jit-weaver';

describe('JitWeaver', () => {
  let context!: ReflectTestingContext;
  let weaver!: JitWeaver;
  beforeEach(() => {
    context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);
  });

  describe('.getAspects()', () => {
    it('returns the aspects that have been enabled', () => {
      @Aspect()
      class Aspect1 {}

      @Aspect()
      class Aspect2 {}

      const [a1, a2] = [new Aspect1(), new Aspect2()];
      weaver.enable(a1, a2);
      expect(weaver.getAspects()).toEqual([a1, a2]);
    });
  });

  describe('.enable(<CLASS>)', () => {
    describe('given a class that is annotated with @Aspect()', () => {
      describe('after a compile annotation has been applied already', () => {
        it('throws an error', () => {
          const AClass = new AnnotationFactory('tests').create(
            AnnotationType.CLASS,
            'AClass',
          );
          @AClass()
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class A {}

          @Aspect()
          class LateAspectA {
            @Compile(on.classes.withAnnotations(AClass))
            shouldThrow() {}
          }

          expect(() => {
            weaver.enable(new LateAspectA());
          }).toThrow(
            new WeavingError(
              'Could not enable aspect LateAspectA: Annotations have already been processed: @tests:AClass',
            ),
          );
        });
        describe('after a before annotation has been applied already', () => {
          it('does not throw an error', () => {
            const AClass = new AnnotationFactory('tests').create(
              AnnotationType.CLASS,
              'AClass',
            );
            @AClass()
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            class A {}

            @Aspect()
            class LateAspectA {
              @Before(on.classes.withAnnotations(AClass))
              shouldNotThrow() {}
            }

            expect(() => {
              weaver.enable(new LateAspectA());
            }).not.toThrow();
          });

          it('calls the before advice', () => {
            const adviceImpl = jest.fn();
            const AClass = new AnnotationFactory('tests').create(
              AnnotationType.CLASS,
              'AClass',
            );
            @AClass()
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            class A {}

            @Aspect()
            class LateAspectA {
              @Before(on.classes.withAnnotations(AClass))
              shouldNotThrow() {
                adviceImpl();
              }
            }

            weaver.enable(new LateAspectA());
            new A();
            expect(adviceImpl).toHaveBeenCalled();
          });
        });
      });

      describe('given a class that is not annotated with @Aspect', () => {
        it('throws an error', () => {
          expect(() => {
            weaver.enable({});
          }).toThrow(
            new WeavingError(`class Object is not annotated with ${Aspect}`),
          );
        });

        describe('but parent class is', () => {
          it('does not throw an error', () => {
            @Aspect()
            class AspectA {}

            class ChildAspectA extends AspectA {}

            expect(() => {
              weaver.enable(new ChildAspectA());
            }).not.toThrow();
          });
        });
      });

      describe('given an aspect instance that already has been enabled', () => {
        it('throws an error', () => {
          @Aspect()
          class Aspect1 {}

          const a1 = new Aspect1();
          expect(() => {
            weaver.enable(a1, a1);
          }).toThrow(
            new WeavingError(
              `Aspect "${Aspect1.name}" has already been registered`,
            ),
          );
        });
      });

      describe('given an instance of an class aspect that has already been enabled', () => {
        it('replaces the previously registered aspect ', () => {
          const advice = jest.fn();
          const TestAnnotation = new AnnotationFactory('tests').create(
            function TestAnnotation() {},
          );
          @Aspect()
          class Aspect1 {
            constructor(private name: string) {}
            @Before(on.methods.withAnnotations(TestAnnotation))
            before() {
              advice(this.name);
            }
          }

          class X {
            @TestAnnotation()
            m() {}
          }
          const a1 = new Aspect1('a1');
          const a2 = new Aspect1('a2');

          expect(() => {
            weaver.enable(a1, a2);
          }).not.toThrow();

          new X().m();
          expect(advice).toBeCalledWith('a2');
          expect(advice).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('.enhance(<ClassAnnotationTarget>)', () => {
    let enhanced!: any;
    let enhanceable!: any;
    let spy: () => void;
    beforeEach(() => {
      spy = jest.fn();
      class TestClass {
        constructor() {
          spy();
        }
      }
      enhanceable = TestClass;
      const atf = context.get(AnnotationTargetFactory);
      const target = atf.of(enhanceable);

      enhanced = weaver.enhance(target as _BindableAnnotationTarget);
    });

    it('returns a class of the same type', () => {
      expect(new enhanced()).toBeInstanceOf(enhanceable);
      expect(spy).toHaveBeenCalled();
    });
  });
});
