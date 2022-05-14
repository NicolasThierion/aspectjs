import { defineMetadata, getMetadata } from '@aspectjs/common/utils';
import type { AnnotationRef } from '../annotation-ref';
import type { AnnotationTarget } from '../target/annotation-target';

type AnnotationTriggerFn = (
  annotation: AnnotationRef,
  annotationArgs: unknown[],
) => void;

export interface AnnotationTrigger {
  target: AnnotationTarget;
  annotations: AnnotationRef[];
  order?: number;
  fn: AnnotationTriggerFn;
}

let _globalId = 0;

interface AnnotationTriggerEntries {
  size: number;

  get(
    annotation: AnnotationRef,
  ): ReturnType<Map<AnnotationRef, AnnotationTrigger[]>['get']>;

  has(
    annotation: AnnotationRef,
  ): ReturnType<Map<AnnotationRef, AnnotationTrigger[]>['has']>;

  entries(
    annotation: AnnotationRef,
  ): ReturnType<Map<AnnotationRef, AnnotationTrigger[]>['entries']>;

  values(): ReturnType<Map<AnnotationRef, AnnotationTrigger[]>['values']>;
}
export class AnnotationTriggerRegistry {
  private readonly _id = _globalId++;
  private readonly _ANNOTATION_TRIGGER_REFLECT_KEY = `aspectjs::trigger=${this._id}`;

  add(trigger: AnnotationTrigger): void {
    const triggers = getMetadata<Map<AnnotationRef, AnnotationTrigger[]>>(
      this._ANNOTATION_TRIGGER_REFLECT_KEY,
      trigger.target.ref,
      () => new Map(),
      true,
    );

    trigger.annotations.forEach((a) => {
      const t = triggers.get(a) ?? [];
      t.push(trigger);
      triggers.set(a, t);
    });

    defineMetadata(
      this._ANNOTATION_TRIGGER_REFLECT_KEY,
      triggers,
      trigger.target.ref,
    );
  }

  get(target: AnnotationTarget): AnnotationTriggerEntries {
    const entries = getMetadata<Map<AnnotationRef, AnnotationTrigger[]>>(
      this._ANNOTATION_TRIGGER_REFLECT_KEY,
      target.ref,
      () => new Map(),
      false,
    );

    return {
      get: (annotation: AnnotationRef) => {
        return entries.get(annotation);
      },
      entries() {
        return entries.entries() ?? ([] as any);
      },
      has(annotation: AnnotationRef) {
        return entries.has(annotation) ?? false;
      },
      values() {
        return entries.values();
      },
      size: entries.size ?? 0,
    };
  }
}
