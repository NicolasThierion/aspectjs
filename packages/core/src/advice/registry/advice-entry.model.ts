import { ConstructorType } from '@aspectjs/common/utils';

import type { AspectType } from '../../aspect/aspect.type';
import type { PointcutType } from '../../pointcut/pointcut-phase.type';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { AdviceType } from '../advice.type';

export type AdviceRegBuckets = {
  [t in PointcutTargetType]?: {
    [p in PointcutType]?: Map<ConstructorType<AspectType>, AdviceEntry[]>;
  };
};

export type AdviceEntry<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
  P extends PointcutType = PointcutType,
> = {
  advice: AdviceType<T, X, P>;
  aspect: AspectType;
};
