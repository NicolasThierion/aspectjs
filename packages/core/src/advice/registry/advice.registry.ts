import { AnnotationRef, AnnotationRegistry } from '@aspectjs/common';
import { ConstructorType, assert, getPrototype } from '@aspectjs/common/utils';

import { AfterReturn } from '../../advices/after-return/after-return.annotation';
import { AfterThrow } from '../../advices/after-throw/after-throw.annotation';
import { After } from '../../advices/after/after.annotation';
import { Around } from '../../advices/around/around.annotation';
import { Compile } from '../../advices/compile/compile.annotation';
import { Before } from '../../advices/before/before.annotation';
import { WeavingError } from '../../errors/weaving.error';
import { Pointcut } from '../../pointcut/pointcut';
import { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { WeaverContext } from '../../weaver/context/weaver.context';
import { AdvicesSelection } from './advices-selection.model';

import { Order } from '../../annotations/order.annotation';
import { Aspect } from '../../aspect/aspect.annotation';
import type { AspectType } from '../../aspect/aspect.type';
import { JoinpointType } from '../../pointcut/pointcut-target.type';
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
    const aspectCtor = getPrototype(aspect).constructor;

    const pointcutAnnotations = new Set<AnnotationRef>();

    const advices: Advice[] = [];
    const processedAdvices = new Map<string, Pointcut[]>();
    // find advices annotations
    this.weaverContext
      .get(AnnotationRegistry)
      .select(...KNOWN_POINTCUT_ANNOTATION_REFS)
      .onMethod(aspectCtor)
      .find({ searchParents: true })
      .forEach((pointcutAnnotation) => {
        const advice: Advice = pointcutAnnotation.target.descriptor
          .value as Advice;

        const type = KNOWN_ADVICE_TYPES[pointcutAnnotation.ref.name]!;
        assert(!!type);

        advice.pointcuts ??= [];

        // do not process advice if it has been processed on a child class already
        let processedPointcuts = processedAdvices.get(advice.name)!;
        if (!processedPointcuts) {
          processedPointcuts = [];
          processedAdvices.set(advice.name, processedPointcuts);
          Reflect.defineProperty(advice, Symbol.toPrimitive, {
            value: () =>
              [...advice.pointcuts]
                .map((p) => `@${p.type}(${p.annotations.join(',')})`)
                .join('|') +
              ` ${aspect.constructor.name}.${String(advice.name)}()`,
          });

          Reflect.defineProperty(advice, 'name', {
            value: advice.name,
          });

          advices.push(advice);
        }

        const expressions = pointcutAnnotation.args as PointcutExpression[];
        expressions.forEach((expression) => {
          let pointcut = new Pointcut({
            type,
            expression: expression,
          });

          // dedupe same advices found on child classes for a similar pointcut
          const similarPointcut = processedPointcuts.filter((p) =>
            p.isAssignableFrom(pointcut),
          )[0];
          if (similarPointcut) {
            pointcut = similarPointcut.merge(pointcut);
          } else {
            advice.pointcuts.push(pointcut);
            processedPointcuts.push(pointcut);
            this.registerAdvice(aspect, pointcut, advice);
          }

          pointcut.annotations.forEach((a) => pointcutAnnotations.add(a));
        });
      });

    advices.forEach(Object.seal);

    this.assertAnnotationsProcessed(aspect, [...pointcutAnnotations]);
  }

  select(filters: AdviceRegistryFilters): AdvicesSelection {
    return new AdvicesSelection(this.buckets, filters, this.adviceSorter);
  }

  private registerAdvice(
    aspect: AspectType,
    pointcut: Pointcut,
    advice: Advice,
  ) {
    const aspectCtor = getPrototype(aspect).constructor;

    const joinpointTypes =
      pointcut.joinpointType === JoinpointType.ANY
        ? [
            JoinpointType.CLASS,
            JoinpointType.GET_PROPERTY,
            JoinpointType.SET_PROPERTY,
            JoinpointType.METHOD,
            JoinpointType.PARAMETER,
          ]
        : [pointcut.joinpointType];

    joinpointTypes
      .map((joinpointType) => (this.buckets[joinpointType] ??= {}))
      .forEach((byTarget) => {
        const byPointcutType = (byTarget[pointcut.type] ??= new Map<
          ConstructorType<AspectType>,
          AdviceEntry[]
        >());

        const byAspect = byPointcutType.get(aspectCtor) ?? [];
        byPointcutType.set(aspectCtor, byAspect);

        byAspect.push(
          AdviceEntry.of({
            advice,
            aspect,
          }),
        );
      });
  }

  private assertAnnotationsProcessed(
    aspect: AspectType,
    annotations: AnnotationRef[],
  ) {
    const adviceEntries = this.select(aspect).find();
    if (!adviceEntries.next()) {
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
      [Aspect.ref, Order.ref, ...KNOWN_POINTCUT_ANNOTATION_REFS].forEach(
        (ref) => processedAnnotations.delete(ref),
      );
    }

    if (processedAnnotations.size) {
      throw new WeavingError(
        `Could not enable aspect ${
          getPrototype(aspect).constructor.name
        }: Annotations have already been processed: ${[
          ...processedAnnotations,
        ].join(',')}`,
      );
    }
  }
}
