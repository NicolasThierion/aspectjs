import { configureTesting } from '@aspectjs/common/testing';
import { annotationsContext } from '../context/annotations.context.global';
import { AnnotationFactory } from '../factory/annotation.factory';
import { AnnotationRegistry } from './annotation.registry';
import { getAnnotations } from './annotations.global';

describe('annotations()', () => {
  let annotationRegistry: AnnotationRegistry;

  let A = class A {};

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
  function setup() {
    A = class A {};
    annotationRegistry = configureTesting(annotationsContext()).get(
      AnnotationRegistry,
    );

    const af = new AnnotationFactory('test');
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
      prop1!: string;

      @A2Annotation('A2')
      @A2PropertyAnnotation('A2prop')
      prop2!: string;

      @A1Annotation('A1')
      @A1MethodAnnotation('A1method')
      fn1(
        @A1Annotation('A1')
        @A1ParameterAnnotation('A1parameter')
        _arg: string,
      ) {}

      @A2Annotation('A2')
      @A2MethodAnnotation('A2method')
      fn2(
        @A2Annotation('A2')
        @A2ParameterAnnotation('A2parameter')
        _arg: string,
      ) {}

      fnX() {}
    }
    A = _A;
    annotationRegistry.select = jest.fn(annotationRegistry.select);
  }

  beforeEach(setup);
  describe('given no parameters', () => {
    it('calls AnnotationRegistry.find()', () => {
      getAnnotations();
      expect(annotationRegistry.select).toHaveBeenCalledTimes(1);
      expect(annotationRegistry.select).toHaveBeenCalledWith();
    });
  });
  describe('given the parameter "A1ClassAnnotation"', () => {
    it('calls AnnotationRegistry.find(A1ClassAnnotation)', () => {
      getAnnotations(A1ClassAnnotation);
      expect(annotationRegistry.select).toHaveBeenCalledTimes(1);
      expect(annotationRegistry.select).toHaveBeenCalledWith(A1ClassAnnotation);
    });
  });
});
