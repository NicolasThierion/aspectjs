import { ConstructorType } from '@aspectjs/common/utils';

import type { AspectType } from '../../aspect/aspect.type';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { Advice, AdviceType } from '../advice.type';

export type AdviceRegBuckets = {
  [t in PointcutTargetType]?: {
    [p in AdviceType]?: Map<ConstructorType<AspectType>, AdviceEntry[]>;
  };
};

export type AdviceEntry<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
  P extends AdviceType = AdviceType,
> = {
  advice: Advice<T, X, P>;
  aspect: AspectType;
};
