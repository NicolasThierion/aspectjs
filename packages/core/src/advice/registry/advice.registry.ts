import { AnnotationRef } from '@aspectjs/common';
import { ConstructorType } from '@aspectjs/common/utils';

import { Pointcut } from '../../pointcut/pointcut';
import { WeaverContext } from '../../weaver/context/weaver.context';
import { AdvicesSelection } from './advices-selection.model';

import { getAspectMetadata, type AspectType } from '../../aspect/aspect.type';
import { PointcutType } from '../../pointcut/pointcut-target.type';
import { AdviceSorter } from '../advice-sort';
import { Advice } from '../advice.type';
import type { AdviceRegBuckets } from './advice-entry.model';
import { AdviceEntry } from './advice-entry.model';

export interface AdviceRegistryFilters {
  aspects?: ConstructorType<AspectType>[];
  annotations?: AnnotationRef[];
}

/**
 * Registry to store all registered advices by aspects.
 */
export class AdviceRegistry {
  private readonly buckets: AdviceRegBuckets = {};

  constructor(
    private readonly weaverContext: WeaverContext,
    private readonly adviceSorter: AdviceSorter,
  ) {}

  register(aspect: AspectType) {
    const advices = getAspectMetadata(aspect).advices;

    advices.forEach((advice) => {
      advice.pointcuts.forEach((pointcut) => {
        this.registerAdvice(aspect, pointcut, advice);
      });
    });
  }

  unregister(aspectId: string) {
    const pointcutTypes = [
      PointcutType.CLASS,
      PointcutType.GET_PROPERTY,
      PointcutType.SET_PROPERTY,
      PointcutType.METHOD,
      PointcutType.PARAMETER,
    ];

    pointcutTypes
      .map((pointcutType) => (this.buckets[pointcutType] ??= {}))
      .forEach((byTarget) => {
        Object.values(byTarget).forEach((byAdviceType) =>
          byAdviceType.set(aspectId, []),
        );
      });
  }

  select(filters: AdviceRegistryFilters): AdvicesSelection {
    return new AdvicesSelection(this.buckets, filters, this.adviceSorter);
  }

  private registerAdvice(
    aspect: AspectType,
    pointcut: Pointcut,
    advice: Advice,
  ) {
    const aspectId = getAspectMetadata(aspect).id;

    const pointcutTypes =
      pointcut.type === PointcutType.ANY
        ? [
            PointcutType.CLASS,
            PointcutType.GET_PROPERTY,
            PointcutType.SET_PROPERTY,
            PointcutType.METHOD,
            PointcutType.PARAMETER,
          ]
        : [pointcut.type];

    pointcutTypes
      .map((pointcutType) => (this.buckets[pointcutType] ??= {}))
      .forEach((byTarget) => {
        const byAdviceType = (byTarget[pointcut.adviceType] ??= new Map<
          string,
          AdviceEntry[]
        >());

        const byAspect = byAdviceType.get(aspectId) ?? [];
        byAdviceType.set(aspectId, byAspect);

        byAspect.push(AdviceEntry.of(aspect, advice));
      });
  }
}
