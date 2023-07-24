import { ConstructorType, getMetadata } from '@aspectjs/common/utils';

import type { AspectType } from '../../aspect/aspect.type';
import type { JoinpointType } from '../../pointcut/pointcut-target.type';
import { AdviceType } from '../advice-type.type';
import type { Advice } from '../advice.type';

export type AdviceRegBuckets = {
  [t in JoinpointType]?: {
    [p in AdviceType]?: Map<ConstructorType<AspectType>, AdviceEntry[]>;
  };
};

export type AdviceEntry<
  T extends JoinpointType = JoinpointType,
  X = unknown,
  P extends AdviceType = AdviceType,
> = {
  advice: Advice<T, X, P>;
  aspect: AspectType;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AdviceEntry {
  export function of(entry: AdviceEntry) {
    return getMetadata(
      'advice-entry',
      entry.aspect,
      entry.advice.name,
      () => entry,
    );
  }
}
