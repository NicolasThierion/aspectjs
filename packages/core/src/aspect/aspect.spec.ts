import { AspectError } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';
import { weaverContext } from './../weaver/context/weaver.context.global';
import { Aspect } from './aspect.annotation';
/* eslint-disable @typescript-eslint/no-unused-vars */

describe('@Aspect annotation', () => {
  beforeEach(() => {
    configureTesting(weaverContext());
  });

  describe('annotated on a class', () => {
    describe('twice', () => {
      it('should throw as AspectError', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => {
          @Aspect()
          @Aspect()
          class TestAspect {}
        }).toThrowError(AspectError);
      });
    });
  });
});
