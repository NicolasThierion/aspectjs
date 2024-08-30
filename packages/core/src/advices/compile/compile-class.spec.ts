import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { ConcreteConstructorType } from '@aspectjs/common/utils';
import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { AdviceError, PointcutType } from '../../public_api';
import { WeaverModule } from '../../weaver/weaver.module';
import { Compile } from './compile.annotation';
import { CompileContext } from './compile.context';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('class advice', () => {
  let compileAdviceA: ReturnType<typeof jest.fn>;
  let compileAdviceB: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let ctorImpl: any;
  const AClass = new AnnotationFactory('test').create(
    AnnotationType.CLASS,
    'AClass',
  );
  const BClass = new AnnotationFactory('test').create(
    AnnotationType.CLASS,
    'BClass',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    compileAdviceA = jest.fn((_c: CompileContext) => {});
    compileAdviceB = jest.fn((_c: CompileContext) => {});
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AClassLabel')
    class AAspect {
      @Compile(on.classes.withAnnotations(...aanotations))
      applyCompile(
        ctxt: CompileContext<PointcutType.CLASS>,
        ...args: unknown[]
      ): void {
        return compileAdviceA.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BClassLabel')
    class BAspect {
      @Compile(on.classes.withAnnotations(...bannotations))
      applyCompile(
        ctxt: CompileContext<PointcutType.CLASS>,
        ...args: unknown[]
      ): void {
        return compileAdviceB.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect);
    weaver.enable(baspect);
    ctorImpl = jest.fn();
  }

  describe('on pointcut @Compile(on.classes.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('calls through each matching advice once', () => {
      compileAdviceA = jest.fn(function (this: any, _ctxt: CompileContext) {});
      compileAdviceB = jest.fn(function (this: any, _ctxt: CompileContext) {});

      expect(compileAdviceA).not.toHaveBeenCalled();
      expect(compileAdviceB).not.toHaveBeenCalled();

      @AClass()
      @BClass()
      class A {
        constructor() {
          ctorImpl();
        }
      }

      expect(compileAdviceA).toHaveBeenCalledTimes(1);
      expect(compileAdviceB).toHaveBeenCalledTimes(1);
      expect(ctorImpl).not.toHaveBeenCalled();
    });
  });

  describe('on pointcut @Compile(on.classes.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => {
      setupAspects([AClass], [BClass]);
    });

    it('calls through the advice once', () => {
      compileAdviceA = jest.fn(function (this: any, _ctxt: CompileContext) {});
      compileAdviceB = jest.fn(function (this: any, _ctxt: CompileContext) {});

      expect(compileAdviceA).not.toHaveBeenCalled();
      expect(compileAdviceB).not.toHaveBeenCalled();

      @AClass()
      @BClass()
      class _A {
        constructor() {
          ctorImpl();
        }
      }

      expect(compileAdviceA).toHaveBeenCalledTimes(1);
      expect(compileAdviceB).toHaveBeenCalledTimes(1);
      expect(ctorImpl).not.toHaveBeenCalled();
    });

    it('creates an object that is an instance of its constructor', () => {
      @AClass()
      class A {}

      expect(new A() instanceof A).toBeTrue();
    });

    it('creates an object that is an instance of its constructor', () => {
      @AClass()
      class A {}

      expect(new A() instanceof A).toBeTrue();
      expect(compileAdviceA).toHaveBeenCalled();
    });

    describe('when the advice returns a value', () => {
      describe('and the value is not a function', () => {
        it('throws an AdviceError', () => {
          compileAdviceA = jest.fn(() => {
            return 'foo';
          });
          expect(() => {
            @AClass()
            class A {}
          }).toThrow(AdviceError);
        });
      });
      describe('and the value is a function', () => {
        it('replaces the constructor with that function', () => {
          const newCtor = jest.fn(function (this: any) {
            this.name = 'newCtor';
          });
          compileAdviceA = jest.fn(function (this: any) {
            return newCtor;
          });

          @AClass()
          class A {
            name?: string;
          }
          expect(compileAdviceA).toHaveBeenCalled();
          expect(newCtor).not.toHaveBeenCalled();
          const a = new A();
          expect(newCtor).toHaveBeenCalled();

          expect(a).toBeInstanceOf(A);
          expect(a.name).toBe('newCtor');
        });
      });
    });

    describe('when multiple "compile" advices are configured', () => {
      it('calls through them one after the other', () => {
        compileAdviceA = jest.fn(function (ctxt: CompileContext) {
          const originalCtor = ctxt.target.proto
            .constructor as ConcreteConstructorType;
          return jest.fn(function (this: any, label: string) {
            Object.assign(this, new originalCtor(label));
            this.name ??= label;
            this.name += 'newCtorA';
          });
        });
        compileAdviceB = jest.fn(function (ctxt: CompileContext) {
          const originalCtor = ctxt.target.proto
            .constructor as ConcreteConstructorType;
          return jest.fn(function (this: any, label: string) {
            Object.assign(this, new originalCtor(label));
            this.name ??= label;
            this.name += 'newCtorB';
          });
        });

        @AClass()
        @BClass()
        class A {
          constructor(public name: string) {}
        }
        expect(compileAdviceA).toHaveBeenCalled();
        const a = new A('A');

        expect(a.name).toBe('AnewCtorBnewCtorA');
      });
    });

    describe('is called with a context that ', () => {
      it('has context.annotations that contains the proper annotation contexts', () => {
        @AClass('annotationArg')
        @BClass()
        class A {
          prop = 'A';
          constructor() {}
        }
        compileAdviceA = jest.fn(
          (ctxt: CompileContext<PointcutType.CLASS, A>) => {
            expect(ctxt.annotations().find().length).toEqual(2);
            const aclassAnnotationContext = ctxt.annotations(AClass).find()[0];
            const bclassAnnotationContext = ctxt.annotations(BClass).find()[0];

            expect(aclassAnnotationContext).toBeTruthy();
            expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
            expect(aclassAnnotationContext?.target.declaringClass).toBe(A);
            expect(bclassAnnotationContext).toBeTruthy();
            expect(bclassAnnotationContext?.args).toEqual([]);
            expect(bclassAnnotationContext?.target.declaringClass).toBe(A);
          },
        );
      });
    });
  });
});
