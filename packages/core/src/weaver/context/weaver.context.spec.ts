import {
  configureTesting,
  ReflectTestingContext,
} from '@aspectjs/common/testing';
import { AspectRegistry } from '../../aspect/aspect.registry';
import { AdviceRegistry } from './../../advice/advice.registry';
import { weaverContext } from './weaver.context.global';

describe('weaverContext()', () => {
  let context!: ReflectTestingContext;
  beforeEach(() => {
    context = configureTesting(weaverContext());
  });
  it('registers a reflect provider for AspectRegistry', () => {
    expect(context.has(AspectRegistry)).toBeTruthy();
  });

  it('registers a reflect provider for AdviceRegistry', () => {
    expect(context.has(AdviceRegistry)).toBeTruthy();
  });

  it('registers a reflect provider for Weaver', () => {
    expect(context.has('Weaver')).toBeTruthy();
  });
});
