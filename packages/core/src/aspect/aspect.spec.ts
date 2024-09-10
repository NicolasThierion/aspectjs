import { configureTesting } from '@aspectjs/common/testing';

import { AspectError } from '../errors/aspect.error';
import { JitWeaver } from '../jit/jit-weaver';
import { WeaverModule } from '../weaver/weaver.module';
import { Aspect } from './aspect.annotation';
import { getAspectMetadata } from './aspect.type';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('@Aspect(<id>) annotation', () => {
  let weaver: JitWeaver;
  beforeEach(() => {
    weaver = configureTesting(WeaverModule).get(JitWeaver);
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

    describe('given no id', () => {
      it('assigns a random id', () => {
        @Aspect()
        class AAspect {}

        @Aspect()
        class BAspect {}

        expect(getAspectMetadata(AAspect).id).toBeDefined();
        expect(getAspectMetadata(AAspect).id).not.toEqual(
          getAspectMetadata(BAspect).id,
        );
      });
    });
    describe('on a subclass', () => {
      it('overrides the id of the parent class', () => {
        @Aspect('AAspect')
        class AAspect {}

        @Aspect('BAspect')
        class BAspect {}

        expect(getAspectMetadata(AAspect).id).toEqual('AAspect');
        expect(getAspectMetadata(BAspect).id).toEqual('BAspect');
      });
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
