import { AnnotationRef, AnnotationRegistry } from '@aspectjs/common';
import { ConstructorType, assert, getPrototype } from '@aspectjs/common/utils';

import { AfterReturn } from '../../advices/after-return/after-return.annotation';
import { AfterThrow } from '../../advices/after-throw/after-throw.annotation';
import { After } from '../../advices/after/after.annotation';
import { Around } from '../../advices/around/around.annotation';
import { Compile } from '../../advices/around/compile.annotation';
import { Before } from '../../advices/before/before.annotation';
import { WeavingError } from '../../errors/weaving.error';
import { Pointcut } from '../../pointcut/pointcut';
import { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { PointcutType } from '../../pointcut/pointcut.type';
import { WeaverContext } from '../../weaver/context/weaver.context';
import { AdvicesSelection } from './advices-selection.model';

import { Aspect } from '../../aspect/aspect.annotation';
import type { AspectType } from '../../aspect/aspect.type';
import type { AdviceType } from '../advice.type';
import type { AdviceEntry, AdviceRegBuckets } from './advice-entry.model';
const KNOWN_ADVICE_ANNOTATION_REFS = new Set([
  Compile.ref,
  Before.ref,
  Around.ref,
  AfterReturn.ref,
  AfterThrow.ref,
  After.ref,
]);

const KNOWN_ADVICE_TYPES = {
  [Compile.name]: PointcutType.COMPILE,
  [Before.name]: PointcutType.BEFORE,
  [Around.name]: PointcutType.AROUND,
  [AfterReturn.name]: PointcutType.AFTER_RETURN,
  [AfterThrow.name]: PointcutType.AFTER_THROW,
  [After.name]: PointcutType.AFTER,
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

  constructor(private readonly weaverContext: WeaverContext) {}

  register(aspect: AspectType) {
    const aspectCtor = getPrototype(aspect).constructor;

    const pointcutAnnotations = new Set<AnnotationRef>();

    const processedAdvices = new Set<string>();
    // find advices annotations
    this.weaverContext
      .get(AnnotationRegistry)
      .select(...KNOWN_ADVICE_ANNOTATION_REFS)
      .onMethod(aspectCtor)
      .find({ searchParents: true })
      .forEach((adviceAnnotation) => {
        const advice: AdviceType = adviceAnnotation.target.descriptor
          .value as AdviceType;

        // dedupe same advices found on parent classes
        if (processedAdvices.has(advice.name)) {
          return;
        }
        processedAdvices.add(advice.name);

        const expression = adviceAnnotation.args[0] as PointcutExpression;
        const type = KNOWN_ADVICE_TYPES[adviceAnnotation.ref.name]!;
        assert(!!type);
        const pointcut = new Pointcut({
          type: type,
          expression,
        });

        advice.pointcut = pointcut;

        Reflect.defineProperty(advice, Symbol.toPrimitive, {
          value: () =>
            `@${pointcut.type}(${pointcut.annotations.join(',')}) ${
              aspect.constructor.name
            }.${String(advice.name)}()`,
        });

        Reflect.defineProperty(advice, 'name', {
          value: advice.name,
        });

        Object.seal(advice);
        this.registerAdvice(aspect, pointcut, advice);
        pointcut.annotations.forEach((a) => pointcutAnnotations.add(a));
      });
    this.assertAnnotationsNotprocessed(aspect, [...pointcutAnnotations]);
  }

  private registerAdvice(
    aspect: AspectType,
    pointcut: Pointcut,
    advice: AdviceType,
  ) {
    const aspectCtor = getPrototype(aspect).constructor;

    const byTarget = (this.buckets[pointcut.targetType] ??= {});
    const byPointcutType = (byTarget[pointcut.type] ??= new Map<
      ConstructorType<AspectType>,
      AdviceEntry[]
    >());

    const byAspect = byPointcutType.get(aspectCtor) ?? [];
    byPointcutType.set(aspectCtor, byAspect);

    byAspect.push({
      advice,
      aspect,
    });
  }

  select(filters: AdviceRegistryFilters): AdvicesSelection {
    return new AdvicesSelection(this.buckets, filters);
  }

  private assertAnnotationsNotprocessed(
    aspect: AspectType,
    annotations: AnnotationRef[],
  ) {
    const adviceEntries = [...this.select(aspect).find()];
    if (!adviceEntries.length) {
      return;
    }
    const processedAnnotations = new Set(
      this.weaverContext
        .get(AnnotationRegistry)
        .select(...annotations)
        .all()
        .find()
        .map((a) => a.ref),
    );

    // Allow @Aspect a advice annotations to be processed already
    if (processedAnnotations.size) {
      [Aspect.ref, ...KNOWN_ADVICE_ANNOTATION_REFS].forEach((ref) =>
        processedAnnotations.delete(ref),
      );
    }

    if (processedAnnotations.size) {
      throw new WeavingError(
        `Could not enable aspect ${
          Object.getPrototypeOf(aspect).constructor.name
        }: Annotations have already been processed: ${[
          ...processedAnnotations,
        ].join(',')}`,
      );
    }
  }
}
