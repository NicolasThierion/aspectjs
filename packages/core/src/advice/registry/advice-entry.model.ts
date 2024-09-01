import { getMetadata } from '@aspectjs/common/utils';

import type { AspectType } from '../../aspect/aspect.type';
import type { PointcutType } from '../../pointcut/pointcut-target.type';
import { AdviceType } from '../advice-type.type';
import type { Advice } from '../advice.type';

export type AdviceRegBuckets = {
  [t in PointcutType]?: {
    [p in AdviceType]?: Map<string, AdviceEntry[]>;
  };
};

export type AdviceEntry<
  T extends PointcutType = PointcutType,
  X = unknown,
  P extends AdviceType = AdviceType,
> = {
  advice: Advice<T, X, P>;
  aspect: AspectType;
  id: string;
};

let globaldviceEntryId = 0;
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
        id: `${advice.name}#${globaldviceEntryId++}`,
      }),
    );
  }
}
