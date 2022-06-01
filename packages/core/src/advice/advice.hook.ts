import {
  Annotation,
  AnnotationFactoryHook,
  AnnotationType,
  DecoratorTargetArgs,
  DecoratorType,
} from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import type { AnnotationTrigger } from 'packages/common/src/annotation/trigger/annotation-trigger.registry';
import { Aspect } from '../aspect/aspect.annotation';
import type { AspectContext } from '../aspect/aspect.context';
import { Pointcut } from '../pointcut/pointcut';
import type { PointcutExpression } from '../pointcut/pointcut-expression.type';
import { PointcutPhase } from '../pointcut/pointcut-phase.type';
import { AfterReturn } from './annotations/after-return.annotation';
import { AfterThrow } from './annotations/after-throw.annotation';
import { After } from './annotations/after.annotation';
import { Around } from './annotations/around.annotation';
import { Before } from './annotations/before.annotation';
import { Compile } from './annotations/compile.annotation';

const KNOWN_ADVICE_ANNOTATIONS = [
  Compile,
  Before,
  Around,
  AfterReturn,
  AfterThrow,
  After,
];

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
  const triggersReg = context.get('annotationTriggerRegistry');
  const adviceRegistry = context.get('adviceRegistry');

  return {
    order: 50,
    name: '@aspectjs::hook:registerAdvice',
    decorator: (annotation, annotationArgs, _annotationStub) => {
      return (...targetArgs: unknown[]) => {
        if (
          !KNOWN_ADVICE_ANNOTATIONS.includes(
            annotation as Annotation<AnnotationType.ANY>,
          )
        ) {
          // Nothing to do with this annotation
          return;
        }
        const target = targetFactory.get<DecoratorType.METHOD>(
          DecoratorTargetArgs.of(targetArgs),
        );

        let triggered = false;
        const onAspectTrigger: AnnotationTrigger = {
          annotations: [Aspect],
          target: target.declaringClass,
          fn: () => {
            if (triggered) {
              return;
            }
            triggered = true;

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
          },
        };

        assert(target.type === DecoratorType.METHOD);
        triggersReg.add(onAspectTrigger);
      };
    },
  };
};
