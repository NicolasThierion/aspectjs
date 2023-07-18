import { configureTesting } from '@aspectjs/common/testing';
import type { ReflectContext } from '../../reflect/reflect.context';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { annotationsContext } from './annotations.context.global';

describe('annotationsContext()', () => {
  let context!: ReflectContext;
  beforeEach(() => {
    context = configureTesting(annotationsContext());
  });

  it(`has a provider for AnnotationTargetFactory`, () => {
    expect(context.has(AnnotationTargetFactory)).toBeTruthy();
    expect(context.get(AnnotationTargetFactory)).toBeInstanceOf(
      AnnotationTargetFactory,
    );
  });
});
