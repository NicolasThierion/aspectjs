import { getMetadata } from '@aspectjs/common/utils';

import type { AspectType } from '../../aspect/aspect.type';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { AdviceKind } from '../advice-type.type';
import type { Advice } from '../advice.type';

export type AdviceRegBuckets = {
  [t in PointcutKind]?: {
    [p in AdviceKind]?: Map<string, AdviceEntry[]>;
  };
};

export type AdviceEntry<
  T extends PointcutKind = PointcutKind,
  X = unknown,
  P extends AdviceKind = AdviceKind,
> = {
  advice: Advice<T, X, P>;
  aspect: AspectType;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AdviceEntry {
  export function of(aspect: AspectType, advice: Advice): AdviceEntry {
    return getMetadata<AdviceEntry>(
      'advice-entry',
      aspect,
      advice.name,
      () => ({
        aspect,
        advice,
      }),
    );
  }
}
