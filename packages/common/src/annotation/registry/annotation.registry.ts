import { AnnotationRef } from '../annotation-ref';

export class AnnotationRegistry {
  private readonly annotations: Set<AnnotationRef['value']> = new Set();
  has(annotationRef: AnnotationRef): boolean {
    return this.annotations.has(annotationRef.toString());
  }

  register(annotationRef: AnnotationRef) {
    if (this.has(annotationRef)) {
      throw new Error(`Annotation "${annotationRef}" already exists`);
    } else {
      this.annotations.add(annotationRef.toString());
    }
  }
}
