import { ReflectModule } from '@aspectjs/common';
import { configureTesting } from './testing-context.global';

describe('configureTesting(<modules>)', () => {
  it('adds the given providers to the reflect context', () => {
    const testingValue = {};
    const testingProvider = {
      provide: 'testing',
      factory: () => testingValue,
    };

    @ReflectModule({
      providers: [testingProvider],
    })
    class TestingModule {}

    @ReflectModule({
      providers: [
        {
          provide: 'testing2',
          factory: () => 'testing2Value',
        },
      ],
    })
    class TestingModule2 {}

    let testingContext = configureTesting(TestingModule, TestingModule2);
    expect(testingContext.get('testing2')).toEqual('testing2Value');
  });
});
