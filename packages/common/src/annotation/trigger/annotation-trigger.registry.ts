import {
  assert,
  defineMetadata,
  getMetadata,
  isObject,
} from '@aspectjs/common/utils';

import { AnnotationType, TargetType } from '../annotation.types';

import type { AnnotationContext } from '../annotation-context';
import { AnnotationRef } from '../annotation-ref';
import type { AnnotationRegistry } from '../registry/annotation.registry';
import type { AnnotationTarget } from '../target/annotation-target';
import type { AnnotationTrigger } from './annotation-trigger.type';

let _globalId = 0;

/**
 * Registry for the {@link AnnotationTrigger}.
 */
export class AnnotationTriggerRegistry {
  private readonly _ANNOTATION_TRIGGER_REFLECT_KEY = `@aspectjs/core:AnnotationTriggerRegistry@${_globalId++}`;

  constructor(private readonly annotationRegistry: AnnotationRegistry) {}
  /**
   * Add an {@link AnnotationTrigger} to the registry.
   *
   * Calls {@link AnnotationTrigger.fn} immediately for each annotation found on the specified {@link AnnotationTrigger.targets}.
   * If the specified annotation is not found, register the annotation in order to call it later when the annotation is applied.
   *
   * @param trigger the {@link AnnotationTrigger} to add
   */
  add(...triggers: AnnotationTrigger[]): this {
    triggers.forEach((trigger) => {
      trigger.targets
        .map((targetOrType) => {
          return isObject(targetOrType)
            ? targetOrType
            : ({
                type: targetOrType,
                ref: getTargetRef(targetOrType),
              } as AnnotationTarget);
        })
        .forEach((target) => {
          const foundAnnotations = new Set<AnnotationRef>();

          // if annotation already applied; calls the trigger right now.
          this.annotationRegistry
            .select(...trigger.annotations.map(AnnotationRef.of))
            .on({ target })
            .find()
            .forEach((a) => {
              trigger.fn(a);
              foundAnnotations.add(a.ref);
            });

          // else, add triggers to the map for not found annotations
          const notFoundAnnotationRefs = trigger.annotations
            .map(AnnotationRef.of)
            .filter((a) => !foundAnnotations.has(a));

          if (notFoundAnnotationRefs.length) {
            const triggers = getMetadata<
              Map<AnnotationRef, AnnotationTrigger[]>
            >(
              this._ANNOTATION_TRIGGER_REFLECT_KEY,
              target.ref,
              () => new Map(),
              true,
            );

            notFoundAnnotationRefs.forEach((a) => {
              const t = triggers.get(a) ?? [];
              t.push(trigger);
              triggers.set(a, t);
            });

            defineMetadata(
              this._ANNOTATION_TRIGGER_REFLECT_KEY,
              triggers,
              target.ref,
            );
          }
        });
    });

    return this;
  }

  /**
   * Calls all the {@link AnnotationTrigger} found for that context
   * @param context
   */
  call(context: AnnotationContext<TargetType, unknown>) {
    const foundTriggers = this.get(context.target);
    foundTriggers
      .get(context.ref)
      ?.sort(
        (t1, t2) =>
          (t1.order ?? Number.MAX_SAFE_INTEGER) -
          (t2.order ?? Number.MAX_SAFE_INTEGER - 1),
      )
      .forEach((t) => t.fn(context));

    foundTriggers.delete(context.ref);
  }

  private get(
    target: AnnotationTarget | TargetType,
  ): Map<AnnotationRef, AnnotationTrigger[]> {
    // find triggers for given target
    const triggers = getMetadata<Map<AnnotationRef, AnnotationTrigger[]>>(
      this._ANNOTATION_TRIGGER_REFLECT_KEY,
      getTargetRef(target),
      () => new Map(),
      false,
    );

    if (typeof target === 'object') {
      // if target is an AnnotationTarget, also find triggers for corresponding AnnotationType
      const annotationTypeEntries = getMetadata<
        Map<AnnotationRef, AnnotationTrigger[]>
      >(
        this._ANNOTATION_TRIGGER_REFLECT_KEY,
        getTargetRef(target.type),
        () => new Map(),
        false,
      );

      annotationTypeEntries.forEach((v, k) => {
        const entry = triggers.get(k) ?? [];
        entry.push(...v);
        triggers.set(AnnotationRef.of(k), entry);
      });
    }

    return triggers;
  }
}

const TARGET_REFS_TOKENS = {
  [AnnotationType.ANY]: {},
  [AnnotationType.CLASS]: {},
  [AnnotationType.METHOD]: {},
  [AnnotationType.PARAMETER]: {},
  [AnnotationType.PROPERTY]: {},
};

function getTargetRef(target: AnnotationTarget | AnnotationType | TargetType) {
  if (typeof target === 'object') {
    return target.ref;
  }

  assert(!!TARGET_REFS_TOKENS[target]);

  return TARGET_REFS_TOKENS[target];
}
