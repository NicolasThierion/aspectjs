import { ReflectModule } from '../public_api';
import { ReflectProvider } from './reflect-provider.type';
import { ReflectContext } from './reflect.context';

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
        @ReflectModule({
          providers: [aProvider],
        })
        class TestModule {}
        reflectContext = new ReflectContext().registerModules(TestModule);
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
            @ReflectModule({
              providers: [
                {
                  provide: A,
                  deps: [B],
                  factory: jest.fn(() => a),
                },
              ],
            })
            class TestModule {}
            reflectContext = new ReflectContext().registerModules(TestModule);
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
            @ReflectModule({
              providers: [aProvider, bProvider],
            })
            class TestModule {}
            reflectContext = new ReflectContext().registerModules(TestModule);
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
          @ReflectModule({
            providers: [
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
            ],
          })
          class TestModule {}
          reflectContext = new ReflectContext().registerModules(TestModule);
        });

        it('returns the A component provided last', () => {
          expect(reflectContext.get(A)).toEqual('A3');
        });

        describe('and providers depends on each-other', () => {
          beforeEach(() => {
            @ReflectModule({
              providers: [
                {
                  provide: A,
                  deps: [A],
                  factory: (a: any) => [...a, 'A1'],
                },
                {
                  provide: A,
                  deps: [A],
                  factory: (a: any) => [...a, 'A2'],
                },
                {
                  provide: A,
                  factory: () => ['A0'],
                },
                {
                  provide: A,
                  deps: [A],
                  factory: (a: any) => [...a, 'A3'],
                },
              ],
            })
            class TestModule {}
            reflectContext = new ReflectContext().registerModules(TestModule);
          });

          it(`calls each provider's factories in order of dependency`, () => {
            const value = reflectContext.get(A);
            expect(value).toContain('A0');
            expect(value).toContain('A2');
            expect(value).toContain('A1');
            expect(value).toContain('A3');
          });
        });

        it(`register the providers only once`, () => {
          aProvider = {
            provide: A,
            factory: jest.fn(() => 'A'),
          };
          @ReflectModule({
            providers: [aProvider],
          })
          class TestModule {}
          reflectContext = new ReflectContext().registerModules(
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
