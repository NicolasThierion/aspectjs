import {
  Annotation,
  AnnotationFactoryHook,
  AnnotationType,
  DecoratorTargetArgs,
  DecoratorType,
} from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import type { AspectContext } from '../aspect/aspect.context';
import { AfterReturn } from './annotations/after-return.annotation';
import { AfterThrow } from './annotations/after-throw.annotation';
import { After } from './annotations/after.annotation';
import { Around } from './annotations/around.annotation';
import { Before } from './annotations/before.annotation';
import { Compile } from './annotations/compile.annotation';
import { Pointcut } from '../pointcut/pointcut';
import type { PointcutExpression } from '../pointcut/pointcut-expression.type';
import { PointcutPhase } from '../pointcut/pointcut-phase.type';
import { Aspect } from '../aspect/aspect.annotation';

const KNOWN_ADVICE_ANNOTATIONS = new Set([
  Compile,
  Before,
  Around,
  AfterReturn,
  AfterThrow,
  After,
]);

const KNOWN_ADVICE_PHASES = {
  [Compile.name]: PointcutPhase.COMPILE,
  [Before.name]: PointcutPhase.BEFORE,
  [Around.name]: PointcutPhase.AROUND,
  [AfterReturn.name]: PointcutPhase.AFTER_RETURN,
  [AfterThrow.name]: PointcutPhase.AFTER_THROW,
  [After.name]: PointcutPhase.AFTER,
};

export const REGISTER_ADVICE_HOOK = (
  context: AspectContext,
): AnnotationFactoryHook => {
  const targetFactory = context.get('annotationTargetFactory');
  const adviceRegistry = context.get('adviceRegistry');
  const annotationRegistry = context.get('annotationRegistry');
  return {
    name: '@aspectjs::hook:registerAdvice',
    decorator: (annotation, annotationArgs, _annotationStub) => {
      return (...targetArgs: unknown[]) => {
        if (
          !KNOWN_ADVICE_ANNOTATIONS.has(
            annotation as Annotation<AnnotationType.METHOD>,
          )
        ) {
          // nothing to do with this annotation
          return;
        }
        const target = targetFactory.get<DecoratorType.METHOD>(
          DecoratorTargetArgs.of(targetArgs),
        );

        assert(target.type === DecoratorType.METHOD);

        if (
          !annotationRegistry
            .find(Aspect)
            .onClass(target.declaringClass.proto.constructor).length
        ) {
          // @Aspect not found. nothing to do with this annotation

          return;
        }

        const expression = annotationArgs[0] as PointcutExpression;
        const phase = KNOWN_ADVICE_PHASES[annotation.name]!;
        assert(!!phase);

        const pointcut = new Pointcut({
          phase,
          expression,
        });

        adviceRegistry.register(
          pointcut,
          target.descriptor.value as () => void,
        );
      };
    },
  };
};
