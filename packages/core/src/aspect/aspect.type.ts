import {
  AnnotationContext,
  AnnotationContextRegistry,
  AnnotationTarget,
  AnnotationTargetFactory,
  AnnotationType,
  reflectContext,
} from '@aspectjs/common';
import { assert, getPrototype } from '@aspectjs/common/utils';
import { AdviceType } from '../advice/advice-type.type';
import { Advice } from '../advice/advice.type';
import { AfterReturn } from '../advices/after-return/after-return.annotation';
import { AfterThrow } from '../advices/after-throw/after-throw.annotation';
import { After } from '../advices/after/after.annotation';
import { Around } from '../advices/around/around.annotation';
import { Before } from '../advices/before/before.annotation';
import { Compile } from '../advices/compile/compile.annotation';
import { Pointcut } from '../pointcut/pointcut';
import { PointcutExpression } from '../pointcut/pointcut-expression.type';
import { AspectMetadata, AspectOptions } from './aspect-metadata.type';
import { Aspect } from './aspect.annotation';

export type AspectType = object & {};

let _globalAspectId = 0;

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
export interface AspectMetadataWithAdvices extends AspectMetadata {
  advices: Advice[];
}

export function getAspectMetadata(
  aspect: AspectType,
): AspectMetadataWithAdvices {
  const target = reflectContext()
    .get(AnnotationTargetFactory)
    .of<AspectType>(aspect);

  return target.getMetadata('ajs.aspect.metadata', () => {
    const annotation:
      | AnnotationContext<AnnotationType.CLASS, typeof Aspect>
      | undefined = reflectContext()
      .get(AnnotationContextRegistry)
      .select(Aspect)
      .on({ target })
      .find({ searchParents: true })[0];

    if (!annotation) {
      throw new TypeError(`${target.label} is not annotated with ${Aspect}`);
    }
    return {
      ...coerceAspectOptions(target, annotation.args[0]),
      advices: _getAdvices(aspect),
    };
  });
}

function _getAdvices(aspect: AspectType) {
  const aspectCtor = getPrototype(aspect).constructor;
  const advices: Advice[] = [];
  const processedAdvicesMap = new Map<string, Pointcut[]>();
  // find advices annotations
  const adviceAnnotations = reflectContext()
    .get(AnnotationContextRegistry)
    .select(...KNOWN_POINTCUT_ANNOTATION_REFS)
    .onMethod(aspectCtor)
    .find({ searchParents: true });

  adviceAnnotations.forEach((adviceAnnotation) => {
    const advice: Advice = adviceAnnotation.target.descriptor.value as Advice;

    const type = KNOWN_ADVICE_TYPES[adviceAnnotation.ref.name]!;
    assert(!!type);

    advice.pointcuts ??= [];

    assert(advice.name.length > 0, 'advice name cannot be empty');
    // do not process advice if it has been processed on a child class already
    let processedAdvices = processedAdvicesMap.get(advice.name)!;
    if (!processedAdvices) {
      processedAdvices = [];
      processedAdvicesMap.set(advice.name, processedAdvices);
      Reflect.defineProperty(advice, Symbol.toPrimitive, {
        value: () =>
          [...advice.pointcuts]
            .map((p) => `@${p.adviceType}(${p.annotations.join(',')})`)
            .join('|') + ` ${aspect.constructor.name}.${String(advice.name)}()`,
      });

      Reflect.defineProperty(advice, 'name', {
        value: advice.name,
      });

      advices.push(advice);
    }

    const expressions = adviceAnnotation.args as PointcutExpression[];
    expressions.forEach((expression) => {
      let pointcut = new Pointcut({
        type,
        expression: expression,
      });

      // dedupe same advices found on child classes for a similar pointcut
      const similarPointcut = [...advice.pointcuts, ...processedAdvices].filter(
        (p) => p.isAssignableFrom(pointcut),
      )[0];
      if (similarPointcut) {
        pointcut = similarPointcut.merge(pointcut);
      } else {
        advice.pointcuts.push(pointcut);
        processedAdvices.push(pointcut);
      }
    });

    assert(() => {
      return (
        new Set(advice.pointcuts.map((p) => p.toString())).size ===
        advice.pointcuts.length
      );
    });
  });

  return advices.map(Object.seal);
}
export function isAspect(aspect: AspectType) {
  return !!getAspectMetadata(aspect);
}
function coerceAspectOptions(
  aspectTarget: AnnotationTarget<AnnotationType.CLASS, AspectType>,
  idOrOptions: unknown,
): AspectMetadata {
  const options: AspectOptions =
    typeof idOrOptions === 'object' ? { ...idOrOptions } : {};

  return {
    id:
      typeof idOrOptions === 'string'
        ? idOrOptions
        : options.id ??
          `${aspectTarget.proto.constructor.name}#${_globalAspectId++}`,
  } satisfies AspectMetadata;
}
