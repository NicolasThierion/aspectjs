import { AspectError } from '@aspectjs/common';
import { configureAspectTestingContext } from '@aspectjs/core/testing';
import { Aspect } from './aspect.annotation';

describe('any class', () => {
  beforeEach(() => {
    configureAspectTestingContext();
  });
  describe('annotated with @Aspect() twice', () => {
    it('is should throw as AspectError', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        @Aspect()
        @Aspect()
        class _TestAspect {}
      }).toThrowError(AspectError);
    });
  });
});
