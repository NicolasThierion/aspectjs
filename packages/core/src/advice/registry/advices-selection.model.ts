import { AnnotationRef } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';

import { Pointcut } from '../../pointcut/pointcut';
import { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { PointcutType } from '../../pointcut/pointcut.type';
import { AdviceEntry, AdviceRegBuckets } from './advice-entry.model';
import { AdviceRegistryFilters } from './advice.registry';

export class AdvicesSelection {
  constructor(
    private readonly buckets: AdviceRegBuckets,
    private readonly filters: AdviceRegistryFilters,
  ) {}

  select(filters?: AdviceRegistryFilters) {
    return new AdvicesSelection(
      this.buckets,
      mergeDeep({}, this.filters, filters),
    );
  }

  find<T extends PointcutTargetType, P extends PointcutType>(
    targetType?: T,
    pointcutType?: P,
  ): IterableIterator<AdviceEntry<T, unknown, P>> {
    const buckets = this.buckets;
    const filters = this.filters;
    const annotationsRefFilter = new Set(
      (this.filters.annotations ?? []).map((a) => AnnotationRef.of(a)),
    );
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const targetTypes: PointcutTargetType[] = targetType
      ? [targetType]
      : (Object.keys(buckets) as PointcutTargetType[]);

    function* generator() {
      for (const targetType of targetTypes) {
        const byTargetType = buckets[targetType] ?? {};
        const pointcutTypes = pointcutType
          ? [pointcutType]
          : (Object.keys(byTargetType) as PointcutType[]);

        for (const pointcutType of pointcutTypes) {
          const map = byTargetType[pointcutType];
          if (map) {
            const adviceEntries = filters.aspects?.length
              ? filters.aspects
                  // .map((a) => Object.getPrototypeOf(a).constructor)
                  .map((a) => map.get(a))
                  .flat()
              : [...map.values()].flat();

            for (const entry of adviceEntries) {
              if (entry) {
                assert(!!entry.advice.pointcut);
                if (
                  annotationFilterMatches(
                    annotationsRefFilter,
                    entry.advice.pointcut,
                  )
                )
                  yield entry as any as AdviceEntry<T, unknown, P>;
              }
            }
          }
        }
      }
    }
    return generator();
  }
}

function annotationFilterMatches(
  annotationsRefFilter: Set<AnnotationRef>,
  pointcut: Pointcut,
) {
  return (
    !annotationsRefFilter.size ||
    !pointcut.annotations.length ||
    new Set([...annotationsRefFilter, ...pointcut.annotations]).size <
      annotationsRefFilter.size + pointcut.annotations.length
  );
}
const isObject = (obj: unknown) => obj && typeof obj === 'object';

function mergeDeep(...objects: any[]) {
  return objects.reduce((prev: any, obj: any) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}
