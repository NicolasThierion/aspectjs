import { AnnotationRef } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';

import { Pointcut } from '../../pointcut/pointcut';
import { PointcutType } from '../../pointcut/pointcut-target.type';
import { AdviceSorter } from '../advice-sort';
import { AdviceType } from '../advice-type.type';
import { AdviceEntry, AdviceRegBuckets } from './advice-entry.model';
import { AdviceRegistryFilters } from './advice.registry';

export class AdvicesSelection {
  constructor(
    private readonly buckets: AdviceRegBuckets,
    private readonly filters: AdviceRegistryFilters,
    private readonly adviceSorter: AdviceSorter,
  ) {
    if (this.filters.annotations) {
      this.filters.annotations = [...new Set(this.filters.annotations)];
    }
  }

  select(filters?: AdviceRegistryFilters) {
    return new AdvicesSelection(
      this.buckets,
      mergeDeep({}, this.filters, filters),
      this.adviceSorter,
    );
  }

  find<T extends PointcutType, P extends AdviceType>(
    pointcutTypes?: T[],
    adviceTypes?: P[],
  ): IterableIterator<AdviceEntry<T, unknown, P>> {
    const buckets = this.buckets;
    const filters = this.filters;
    const adviceSorter = this.adviceSorter;
    const annotationsRefFilter = new Set(
      (this.filters.annotations ?? []).map((a) => AnnotationRef.of(a)),
    );
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _pointcutTypes: PointcutType[] = pointcutTypes?.length
      ? pointcutTypes
      : (Object.keys(buckets) as PointcutType[]);

    function* generator() {
      // advice that are applied to multiple pointcuts are merged into a single entry.
      // In this case, the same entry is registered multiple times in the map.
      // We have to remember what entries are generated to avoir generating the same entry twice
      const generatedEntrySet = new Set();

      for (const pointcutType of _pointcutTypes) {
        const byPointcutType = buckets[pointcutType] ?? {};
        const _adviceTypes = adviceTypes?.length
          ? adviceTypes
          : (Object.keys(byPointcutType) as AdviceType[]);

        for (const pointcutType of _adviceTypes) {
          const map = byPointcutType[pointcutType];
          if (map) {
            const adviceEntries = (
              filters.aspects?.length
                ? filters.aspects.map((a) => map.get(a)).flat()
                : [...map.values()].flat()
            )
              .filter((a) => !!a)
              .map((a) => a!)
              .sort((a1, a2) => adviceSorter.sort(a1, a2));

            for (const entry of adviceEntries) {
              assert(!!entry.advice.pointcuts?.length);
              if (
                annotationFilterMatches(
                  annotationsRefFilter,
                  entry.advice.pointcuts,
                ) &&
                !generatedEntrySet.has(entry)
              ) {
                generatedEntrySet.add(entry);
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
  pointcuts: Pointcut[],
) {
  const pointcutsAnnotations = new Set(pointcuts.flatMap((p) => p.annotations));
  return (
    !annotationsRefFilter.size ||
    !pointcutsAnnotations.size ||
    new Set([...annotationsRefFilter, ...pointcutsAnnotations]).size <
      annotationsRefFilter.size + pointcutsAnnotations.size
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
