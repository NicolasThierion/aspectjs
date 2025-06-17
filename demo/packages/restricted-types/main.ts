import { AnnotationFactory, AnnotationKind } from "@aspectjs/common";
import {
  Around,
  AroundContext,
  Aspect,
  AspectError,
  Compile,
  CompileContext,
  getWeaver,
  JoinPoint,
  on,
} from "@aspectjs/core";

// Create the annotation factory
const ANNOTATION_FACTORY = new AnnotationFactory("demo");

// Create a class annotation
export const Memo = ANNOTATION_FACTORY.create("Memo", () => {
  // stub
});

@Aspect()
class MemoAspect {
  @Compile(on.classes.withAnnotations(Memo))
  assertProperType(context: CompileContext) {
    if (
      context.target.kind !== AnnotationKind.METHOD &&
      context.target.kind !== AnnotationKind.PROPERTY
    ) {
      throw new AspectError(
        MemoAspect,
        `Annotation ${Memo} is only allowed on methods & properties`
      );
    }
  }

  @Around(on.methods.withAnnotations(Memo), on.properties.withAnnotations(Memo))
  myAdvice(context: AroundContext, jp: JoinPoint) {
    // TODO implement memoization
    return jp(...context.args);
  }
}

getWeaver().enable(new MemoAspect());

@Memo() // ERROR: AspectError: [MemoAspect#0]: Annotation @Memo is only allowed on methods & properties
export class A {
  @Memo()
  property = "test";

  @Memo()
  method() {
    return "method";
  }
}

console.log(new A().property);
console.log(new A().method());
