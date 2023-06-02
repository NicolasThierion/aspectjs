import { ReflectProvider } from './reflect-provider.type';
import { ReflectContext } from './reflect.context';
import { ReflectModule } from './reflect.module';

describe('ReflectContext', () => {
  let reflectContext: ReflectContext;
  let A: any;
  let B: any;
  let a: any;
  let aProvider!: ReflectProvider<typeof A>;
  let bProvider!: ReflectProvider<typeof B>;
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
        aProvider = {
          provide: A,
          factory: jest.fn(() => a),
        };
        class TestModule implements ReflectModule {
          providers = [aProvider];
        }
        reflectContext = new ReflectContext().addModules(TestModule);
      });

      it('returns the component', () => {
        expect(reflectContext.get(A)).toEqual(a);
      });

      it(`calls the provider's factory function`, () => {
        expect(aProvider?.factory).not.toHaveBeenCalled();
        reflectContext.get(A);
        expect(aProvider?.factory).toHaveBeenCalled();
      });

      describe('and A has a dependency on B', () => {
        describe('but B was not provided', () => {
          beforeEach(() => {
            class TestModule implements ReflectModule {
              providers = [
                {
                  provide: A,
                  deps: [B],
                  factory: jest.fn(() => a),
                },
              ];
            }
            reflectContext = new ReflectContext().addModules(TestModule);
          });
          it('throws an error', () => {
            expect(() => reflectContext.get(A)).toThrowError(
              'No ReflectContext provider found for B. Needed by A',
            );
          });
        });

        describe('and B was provided', () => {
          beforeEach(() => {
            aProvider = {
              provide: A,
              deps: [B],
              factory: jest.fn(() => 'A'),
            };

            bProvider = {
              provide: B,
              deps: [],
              factory: jest.fn(() => 'B'),
            };
            class TestModule implements ReflectModule {
              providers = [aProvider, bProvider];
            }
            reflectContext = new ReflectContext().addModules(TestModule);
          });
          it('returns the A component', () => {
            expect(reflectContext.get(A)).toEqual('A');
          });
          it(`calls the provider's factory function for A`, () => {
            expect(aProvider?.factory).not.toHaveBeenCalled();
            reflectContext.get(A);
            expect(aProvider?.factory).toHaveBeenCalledWith('B');
          });
          it(`calls the provider's factory function for B`, () => {
            expect(bProvider?.factory).not.toHaveBeenCalled();
            reflectContext.get(A);
            expect(bProvider?.factory).toHaveBeenCalled();
          });
        });
      });
      describe('multiple times', () => {
        beforeEach(() => {
          class TestModule implements ReflectModule {
            providers = [
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
          }
          reflectContext = new ReflectContext().addModules(TestModule);
        });

        it('returns the A component provided last', () => {
          expect(reflectContext.get(A)).toEqual('A3');
        });

        describe('and providers depends on each-other', () => {
          beforeEach(() => {
            class TestModule implements ReflectModule {
              providers = [
                {
                  provide: A,
                  deps: [A],
                  factory: (a: any) => [a, 'A1'].join('-'),
                },
                {
                  provide: A,
                  deps: [A],
                  factory: (a: any) => [a, 'A2'].join('-'),
                },
                {
                  provide: A,
                  factory: () => 'A0',
                },
                {
                  provide: A,
                  deps: [A],
                  factory: (a: any) => [a, 'A3'].join('-'),
                },
              ];
            }
            reflectContext = new ReflectContext().addModules(TestModule);
          });

          it(`calls provider's factories in order of dependency`, () => {
            expect(reflectContext.get(A)).toEqual('A0-A2-A1-A3');
          });
        });

        it(`register the providers only once`, () => {
          aProvider = {
            provide: A,
            factory: jest.fn(() => 'A'),
          };
          class TestModule implements ReflectModule {
            providers = [aProvider];
          }
          reflectContext = new ReflectContext().addModules(
            TestModule,
            TestModule,
          );
          expect(reflectContext.get(A)).toEqual('A');
          expect(aProvider?.factory).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
