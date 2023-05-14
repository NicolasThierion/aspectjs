import { configureTesting } from '@aspectjs/common/testing';
import { annotationsContext } from './context/annotations.context.global';
import { AnnotationFactory } from './factory/annotation.factory';
import {
  AnnotationRegistry,
  AnnotationSelection,
} from './registry/annotation.registry';

describe('AnnotationContext', () => {
  let A1Annotation: any;
  let A2Annotation: any;
  let A1ClassAnnotation: any;
  let A2ClassAnnotation: any;
  let A1PropertyAnnotation: any;
  let A2PropertyAnnotation: any;
  let A1MethodAnnotation: any;
  let A2MethodAnnotation: any;
  let A1ParameterAnnotation: any;
  let A2ParameterAnnotation: any;
  let s: AnnotationSelection;
  let annotationRegistry: AnnotationRegistry;

  let A = class A {
    prop1!: string;
    prop2!: string;
    fn1(..._args: any[]): any {}
    fn2(..._args: any[]): any {}
  };

  beforeEach(() => {
    const af = new AnnotationFactory('test');
    annotationRegistry = configureTesting(annotationsContext()).get(
      AnnotationRegistry,
    );

    A1Annotation = af.create('A1Annotation');
    A2Annotation = af.create('A2Annotation');
    A1ClassAnnotation = af.create('A1ClassAnnotation');
    A2ClassAnnotation = af.create('A2ClassAnnotation');
    A1PropertyAnnotation = af.create('A1PropertyAnnotation');
    A2PropertyAnnotation = af.create('A2PropertyAnnotation');
    A1MethodAnnotation = af.create('A1MethodAnnotation');
    A2MethodAnnotation = af.create('A2MethodAnnotation');
    A1ParameterAnnotation = af.create('A1ParameterAnnotation');
    A2ParameterAnnotation = af.create('A2ParameterAnnotation');

    @A1Annotation('A1')
    @A2Annotation('A2')
    @A1ClassAnnotation('A1class')
    @A2ClassAnnotation('A2class')
    class _A extends A {
      @A1Annotation('A1')
      @A1PropertyAnnotation('A1prop')
      override prop1!: string;

      @A2Annotation('A2')
      @A2PropertyAnnotation('A2prop')
      override prop2!: string;

      @A1Annotation('A1')
      @A1MethodAnnotation('A1method')
      override fn1(
        @A1Annotation('A1')
        @A1ParameterAnnotation('A1parameter')
        _arg: string,
        @A2ParameterAnnotation('A2parameter')
        _arg2: string,
      ) {}

      @A2Annotation('A2')
      @A2MethodAnnotation('A2method')
      override fn2(
        @A2Annotation('A2')
        @A2ParameterAnnotation('A2parameter')
        _arg: string,
      ) {}

      fnX() {}
    }
    A = _A;

    s = annotationRegistry.select();
  });

  describe('<CLASS>', () => {
    describe('.bind(a)', () => {
      it('binds value=the class instance', () => {
        const a = new A();
        const annotation = s.onClass(A).find()[0];

        expect(annotation).toBeTruthy();
        expect(annotation!.bind(a).value).toBe(a);
      });
    });
  });
  describe('<METHOD>', () => {
    describe('.bind(a)', () => {
      it('binds value=the annotated method', () => {
        const a = new A();
        const annotation = s.onMethod(A, 'fn1').find()[0];
        const bound = annotation!.bind(a);
        expect(annotation).toBeTruthy();
        expect(bound.value === a.fn1 || bound.value === a.fn2).toBeTruthy();
      });
    });

    describe('<PROPERTY>', () => {
      it('returns annotations where value=the property value instance', () => {
        const a = new A();
        a.prop1 = 'value1';
        const annotation = s.onProperty(A, 'prop1').find()[0];

        expect(annotation).toBeTruthy();
        expect(annotation!.bind(a).value).toBe('value1');
      });
    });

    describe('<PARAMETER>', () => {
      it('returns annotations where value=the property value instance', () => {
        s = annotationRegistry.select(A2ParameterAnnotation);

        const a = new A();
        a.prop1 = 'value1';
        const annotation = s
          .onArgs(A, 'fn1')

          .find()[0];

        expect(annotation).toBeTruthy();
        expect(annotation!.bind(a, ['aarg1', 'aarg2']).value).toEqual('aarg2');
      });
    });
  });
});
