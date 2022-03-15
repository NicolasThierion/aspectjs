import { hello } from './hello';
import { configureTestingContext } from '@aspectjs/common/testing';

xdescribe('core', () => {
  beforeEach(() => {
    configureTestingContext();
  });
  it('not implemented', () => {
    hello();
  });
});
