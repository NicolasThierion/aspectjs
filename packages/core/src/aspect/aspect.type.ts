import {
  AnnotationContext,
  AnnotationRegistry,
  AnnotationTarget,
  AnnotationTargetFactory,
  AnnotationType,
  reflectContext,
} from '@aspectjs/common';
import { AspectMetadata } from './aspect-metadata.type';
import { Aspect } from './aspect.annotation';

export const ASPECT_ID_SYMBOL = Symbol.for('aspectjs:aspectId');

export type AspectType = object & {
  [ASPECT_ID_SYMBOL]?: string;
};

let _globalAspectId = 0;

export function getAspectMetadata(
  aspect: AspectType,
): Required<AspectMetadata> {
  const target = reflectContext()
    .get(AnnotationTargetFactory)
    .of<AspectType>(aspect);

  return target.getMetadata('@ajs:aspectMeta', () => {
    const annotation:
      | AnnotationContext<AnnotationType.CLASS, typeof Aspect>
      | undefined = reflectContext()
      .get(AnnotationRegistry)
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
): Required<AspectMetadata> {
  const options: AspectMetadata =
    typeof idOrOptions === 'object' ? { ...idOrOptions } : {};

  options.id =
    typeof idOrOptions === 'string'
      ? idOrOptions
      : options.id ??
        `${aspectTarget.proto.constructor.name}#${_globalAspectId++}`;
  return options as Required<AspectMetadata>;
}
