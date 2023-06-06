import { configureTesting } from '@aspectjs/common/testing';
import { getWeaver, weaverContext } from '@aspectjs/core';
import { Memo } from './memo.annotation';
import { MemoAspect } from './memo.aspect';

describe('Memo aspect', () => {
  let mImpl = jest.fn();
  let A = class A {
    m(..._args: any[]) {}
  };
  beforeEach(() => {
    configureTesting(weaverContext());
    getWeaver().enable(new MemoAspect());
    mImpl = jest.fn();
    class _A {
      @Memo()
      m(...args: any[]) {
        return mImpl(...args);
      }
    }
    A = _A;
  });

  describe('given a method that is NOT annotated with @Memo', () => {
    describe('calling the method twice', () => {
      it('calls the method twice', () => {
        class A {
          m(...args: any[]) {
            return mImpl(...args);
          }
        }
        const a = new A();
        a.m();
        a.m();

        expect(mImpl).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('given a method that is annotated with @Memo', () => {
    describe('calling the method', () => {
      it('returns the original value returned by the method', () => {
        mImpl = jest.fn(() => 'value');
        expect(new A().m()).toBe('value');
      });

      describe('twice', () => {
        describe('with same parameters', () => {
          describe('on the same instance', () => {
            it('calls the method once', () => {
              const a = new A();
              mImpl = jest.fn(() => {
                return 'value';
              });
              a.m('x');
              a.m('x');
              expect(mImpl).toHaveBeenCalledTimes(1);
            });
          });

          describe('on two different instances', () => {
            it('calls the method twice', () => {
              mImpl = jest.fn(() => {
                'value';
              });
              new A().m('x');
              new A().m('x');
              expect(mImpl).toHaveBeenCalledTimes(2);
            });
          });
        });

        describe('with different parameters', () => {
          it('calls the method twice', () => {
            mImpl = jest.fn(() => {
              'value';
            });
            const a = new A();
            a.m('x');
            a.m('y');
            expect(mImpl).toHaveBeenCalledTimes(2);
          });
        });
      });
    });
  });
});
