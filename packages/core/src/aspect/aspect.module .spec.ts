import type { TestingReflectContext } from '@aspectjs/common';
import { configureReflectTestingContext } from '@aspectjs/common/testing';
import { AspectModule } from './aspect.module';

describe('AspectModule', () => {
  let context!: TestingReflectContext;
  beforeEach(() => {
    context?.reset();
    context = configureReflectTestingContext(new AspectModule());
  });
  it('registers an AspectRegistry to the ReflectContext', () => {
    expect(context.has('aspectRegistry')).toBeTruthy();
  });

  it('registers the Weaver to the ReflectContext', () => {
    expect(context.has('weaver')).toBeTruthy();
  });
});
