import { AnnotationContextRegistry, AnnotationRef } from '@aspectjs/common';
import { ConstructorType, assert, getPrototype } from '@aspectjs/common/utils';

import { AfterReturn } from '../../advices/after-return/after-return.annotation';
import { AfterThrow } from '../../advices/after-throw/after-throw.annotation';
import { After } from '../../advices/after/after.annotation';
import { Around } from '../../advices/around/around.annotation';
import { Before } from '../../advices/before/before.annotation';
import { Compile } from '../../advices/compile/compile.annotation';
import { WeavingError } from '../../errors/weaving.error';
import { Pointcut } from '../../pointcut/pointcut';
import { WeaverContext } from '../../weaver/context/weaver.context';
import { AdvicesSelection } from './advices-selection.model';

import { CompileAdvice } from '../../advices/compile/compile.type';
import { getAspectMetadata, type AspectType } from '../../aspect/aspect.type';
import { PointcutType } from '../../pointcut/pointcut-target.type';
import { AdviceSorter } from '../advice-sort';
import { AdviceType } from '../advice-type.type';
import { Advice } from '../advice.type';
import type { AdviceRegBuckets } from './advice-entry.model';
import { AdviceEntry } from './advice-entry.model';
const KNOWN_POINTCUT_ANNOTATION_REFS = new Set([
  Compile.ref,
  Before.ref,
  Around.ref,
  AfterReturn.ref,
  AfterThrow.ref,
  After.ref,
]);

const KNOWN_ADVICE_TYPES = {
  [Compile.name]: AdviceType.COMPILE,
  [Before.name]: AdviceType.BEFORE,
  [Around.name]: AdviceType.AROUND,
  [AfterReturn.name]: AdviceType.AFTER_RETURN,
  [AfterThrow.name]: AdviceType.AFTER_THROW,
  [After.name]: AdviceType.AFTER,
};

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
        if (pointcut.adviceType === AdviceType.COMPILE) {
          this.assertAnnotationNotProcessedBeforeCompileAdvice(
            aspect,
            advice as CompileAdvice,
          );
        }
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

  private assertAnnotationNotProcessedBeforeCompileAdvice(
    aspect: AspectType,
    advice: CompileAdvice,
  ) {
    const annotations = new Set(
      advice.pointcuts.flatMap((a) => a.annotations).map((a) => a),
    );

    if (!annotations.size) {
      return;
    }

    const processedAnnotations = new Set(
      this.weaverContext
        .get(AnnotationContextRegistry)
        .select(...annotations)
        .all()
        .find()
        .map((a) => a.ref),
    );

    if (processedAnnotations.size) {
      const err = `Could not enable aspect ${
        getPrototype(aspect).constructor.name
      }: Annotations have already been processed: ${[
        ...processedAnnotations,
      ].join(',')}`;
      assert(false, err);
      throw new WeavingError(err);
    }
  }
}
