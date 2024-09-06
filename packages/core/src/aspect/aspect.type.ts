import {
  AnnotationContext,
  AnnotationContextRegistry,
  AnnotationTarget,
  AnnotationTargetFactory,
  AnnotationType,
  reflectContext,
} from '@aspectjs/common';
import { AspectMetadata, AspectOptions } from './aspect-metadata.type';
import { Aspect } from './aspect.annotation';

export type AspectType = object & {};

let _globalAspectId = 0;

export function getAspectMetadata(aspect: AspectType): AspectMetadata {
  const target = reflectContext()
    .get(AnnotationTargetFactory)
    .of<AspectType>(aspect);

  return target.getMetadata('@ajs:aspectMeta', () => {
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
    return coerceAspectOptions(target, annotation.args[0]);
  });
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
