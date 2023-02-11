import { ReflectContext } from './reflect.context';

import type { ReflectProvider } from './reflect-provider.type';
describe('ReflectContext', () => {
  let reflectContext: ReflectContext;
  let PROVIDERS: ReflectProvider[];
  let A: any;
  let B: any;
  let a: any;
  beforeEach(() => {
    A = class A {
      constructor(public val?: string) {}
    };
    B = class B {
      constructor(public val?: string) {}
    };

    a = new A('a');
  });
  describe(`.get(A)`, () => {
    describe(`when 'A' has NOT been provided`, () => {
      beforeEach(() => {
        reflectContext = new ReflectContext();
      });
      it('throws an error', () => {
        expect(() => reflectContext.get(A)).toThrowError(
          'No ReflectContext provider found for A',
        );
      });
    });

    describe(`when A has been provided`, () => {
      beforeEach(() => {
        PROVIDERS = [
          {
            provide: A,
            factory: jest.fn(() => a),
          },
        ];
        reflectContext = new ReflectContext().addModules({
          providers: PROVIDERS,
        });
      });

      it('returns the component', () => {
        expect(reflectContext.get(A)).toEqual(a);
      });

      it(`calls the provider's factory function`, () => {
        const aProvider = PROVIDERS.filter((p) => p.provide === A)[0];
        expect(aProvider?.factory).not.toHaveBeenCalled();
        reflectContext.get(A);
        expect(aProvider?.factory).toHaveBeenCalled();
      });

      describe('and A has a dependency on B', () => {
        describe('but B was not provided', () => {
          beforeEach(() => {
            PROVIDERS = [
              {
                provide: A,
                deps: [B],
                factory: jest.fn(() => a),
              },
            ];
            reflectContext = new ReflectContext().addModules({
              providers: PROVIDERS,
            });
          });
          it('throws an error', () => {
            expect(() => reflectContext.get(A)).toThrowError(
              'No ReflectContext provider found for B. Needed by A',
            );
          });
        });

        describe('and B was provided', () => {
          beforeEach(() => {
            PROVIDERS = [
              {
                provide: A,
                deps: [B],
                factory: jest.fn(() => 'A'),
              },
              {
                provide: B,
                deps: [],
                factory: jest.fn(() => 'B'),
              },
            ];
            reflectContext = new ReflectContext().addModules({
              providers: PROVIDERS,
            });
          });
          it('returns the A component', () => {
            expect(reflectContext.get(A)).toEqual('A');
          });
          it(`calls the provider's factory function for A`, () => {
            const aProvider = PROVIDERS.filter((p) => p.provide === A)[0];
            expect(aProvider?.factory).not.toHaveBeenCalled();
            reflectContext.get(A);
            expect(aProvider?.factory).toHaveBeenCalledWith('B');
          });
          it(`calls the provider's factory function for B`, () => {
            const aProvider = PROVIDERS.filter((p) => p.provide === B)[0];
            expect(aProvider?.factory).not.toHaveBeenCalled();
            reflectContext.get(A);
            expect(aProvider?.factory).toHaveBeenCalled();
          });
        });
      });
      describe('multiple times', () => {
        beforeEach(() => {
          PROVIDERS = [
            {
              provide: A,
              factory: () => 'A1',
            },
            {
              provide: A,
              factory: () => 'A2',
            },
            {
              provide: A,
              factory: () => 'A3',
            },
          ];
          reflectContext = new ReflectContext().addModules({
            providers: PROVIDERS,
          });
        });

        it('returns the A component provided last', () => {
          expect(reflectContext.get(A)).toEqual('A3');
        });

        describe('and providers depends on each-other', () => {
          beforeEach(() => {
            PROVIDERS = [
              {
                provide: A,
                deps: [A],
                factory: (a) => [a, 'A1'].join('-'),
              },
              {
                provide: A,
                deps: [A],
                factory: (a) => [a, 'A2'].join('-'),
              },
              {
                provide: A,
                factory: () => 'A0',
              },
              {
                provide: A,
                deps: [A],
                factory: (a) => [a, 'A3'].join('-'),
              },
            ];
            reflectContext = new ReflectContext().addModules({
              providers: PROVIDERS,
            });
          });

          it(`calls provider's factories in order of dependency`, () => {
            expect(reflectContext.get(A)).toEqual('A0-A2-A1-A3');
          });
        });

        describe('with the exact same provider', () => {
          beforeEach(() => {
            PROVIDERS = [
              {
                provide: A,
                factory: jest.fn(() => 'A'),
              },
            ];
            reflectContext = new ReflectContext().addModules(
              {
                providers: PROVIDERS,
              },
              {
                providers: PROVIDERS,
              },
            );
          });

          it(`register the providers only once`, () => {
            expect(reflectContext.get(A)).toEqual('A');
            expect(PROVIDERS[0]?.factory).toHaveBeenCalledTimes(1);
          });
        });
      });
    });
  });
});
