import { ReflectContext } from '../../src/reflect/reflect.context';
import { reflectContext } from '../../src/reflect/reflect.context.global';
import { ReflectModule } from '../../src/reflect/reflect.module';
import { configureTesting, ReflectTestingContext } from './setup';

describe('configureTesting(<initialContext>)', () => {
  it('resets the providers to the ones in the initialContext', () => {
    const context = new ReflectContext();

    const testingValue = {};
    const testingProvider = {
      provide: 'testing',
      factory: () => testingValue,
    };

    context.addModules(
      class TestingModule implements ReflectModule {
        providers = [testingProvider];
      },
    );

    let testingContext = configureTesting(context);
    testingContext.addModules(
      class TestingModule2 implements ReflectModule {
        providers = [
          {
            provide: 'testing2',
            factory: () => 'testing2',
          },
        ];
      },
    );
    testingContext = configureTesting(context);
    expect(() => {
      testingContext.get('testing2');
    }).toThrow();
  });

  describe('called after the initialContext is configured', () => {
    let context: ReflectContext;
    let testingContext: ReflectTestingContext;

    const testingValue = {};
    const testingProvider = {
      provide: 'testing',
      factory: () => testingValue,
    };
    beforeEach(() => {
      context = new ReflectContext();

      context.addModules(
        class TestingModule implements ReflectModule {
          providers = [testingProvider];
        },
      );

      testingContext = configureTesting(context);
    });
    it('preserves the providers of the initialContext', () => {
      expect(testingContext.get(testingProvider.provide)).toEqual(testingValue);
    });
  });
});
