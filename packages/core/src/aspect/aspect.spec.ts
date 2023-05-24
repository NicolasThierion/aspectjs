import { configureTesting } from '@aspectjs/common/testing';

import { AspectError } from '../errors/aspect.error';
import { JitWeaver } from '../jit/jit-weaver';
import { weaverContext } from '../weaver/context/weaver.context.global';
import { Aspect } from './aspect.annotation';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('@Aspect annotation', () => {
  let weaver: JitWeaver;
  beforeEach(() => {
    weaver = configureTesting(weaverContext()).get(JitWeaver);
    jest.spyOn(weaver as JitWeaver, 'enhance');
  });

  describe('annotated on a class', () => {
    it('calls "Weaver.enhance"', () => {
      expect(weaver.enhance).not.toHaveBeenCalled();
      try {
        @Aspect()
        class TestAspect {}
      } catch (e) {
        // noop
      }

      expect(weaver.enhance).toHaveBeenCalled();
    });
    xdescribe('twice', () => {
      it('throws as AspectError', () => {
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
