import {
  AnnotationContext,
  annotationsContext,
  AnnotationTrigger,
  AnnotationTriggerRegistry,
  TargetType,
} from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { Aspect } from '../aspect/aspect.annotation';
import { Pointcut } from '../pointcut/pointcut';
import type { PointcutExpression } from '../pointcut/pointcut-expression.type';
import { AdviceType } from '../pointcut/pointcut-phase.type';
import { weaverContext } from './../weaver/context/weaver.context.global';
import { AdviceRegistry } from './advice.registry';
import { AfterReturn } from './annotations/after-return.annotation';
import { AfterThrow } from './annotations/after-throw.annotation';
import { After } from './annotations/after.annotation';
import { Around } from './annotations/around.annotation';
import { Before } from './annotations/before.annotation';
import { Compile } from './annotations/compile.annotation';

const KNOWN_ADVICE_ANNOTATION_REFS = [
  Compile.ref,
  Before.ref,
  Around.ref,
  AfterReturn.ref,
  AfterThrow.ref,
  After.ref,
];

const KNOWN_ADVICE_TYPES = {
  [Compile.name]: AdviceType.COMPILE,
  [Before.name]: AdviceType.BEFORE,
  [Around.name]: AdviceType.AROUND,
  [AfterReturn.name]: AdviceType.AFTER_RETURN,
  [AfterThrow.name]: AdviceType.AFTER_THROW,
  [After.name]: AdviceType.AFTER,
};

export const REGISTER_ADVICE_TRIGGER: AnnotationTrigger = {
  annotations: KNOWN_ADVICE_ANNOTATION_REFS,
  order: 50,
  targets: [TargetType.METHOD],
  fn: (annotation: AnnotationContext<TargetType.METHOD>) => {
    const aContext = annotationsContext();
    const wContext = weaverContext();
    const triggersReg = aContext.get(AnnotationTriggerRegistry);
    const adviceRegistry = wContext.get(AdviceRegistry);

    const target = annotation.target;
    const onAspectTrigger: AnnotationTrigger = {
      annotations: [Aspect.ref],
      targets: [target.declaringClass],
      fn: () => {
        const expression = annotation.args[0] as PointcutExpression;
        const type = KNOWN_ADVICE_TYPES[annotation.annotation.name]!;
        assert(!!type);

        const pointcut = new Pointcut({
          adviceType: type,
          expression,
        });

        adviceRegistry.register(
          pointcut,
          target.descriptor.value as () => void,
        );
      },
    };

    assert(target.type === TargetType.METHOD);
    triggersReg.add(onAspectTrigger);
  },
};
