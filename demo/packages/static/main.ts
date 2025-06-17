import { AnnotationFactory } from "@aspectjs/common";
import {
  AfterReturn,
  AfterReturnContext,
  Aspect,
  getWeaver,
  on,
} from "@aspectjs/core";

// Create the annotation factory
const ANNOTATION_FACTORY = new AnnotationFactory("demo");

// Create a class annotation
export const Uppercase = ANNOTATION_FACTORY.create("Uppercase", () => {
  // stub
});

@Aspect()
class UppercaseAspect {
  @AfterReturn(
    on.methods.withAnnotations(Uppercase),
    on.properties.withAnnotations(Uppercase)
  )
  myAdvice(context: AfterReturnContext) {
    const v = context.value;
    return typeof v === "string" ? v.toUpperCase() : v;
  }
}

getWeaver().enable(new UppercaseAspect());

export class A {
  @Uppercase()
  static staticProperty = "test";
  @Uppercase()
  static staticMethod(ping: string): string {
    return `${ping} -> pong`;
  }
}

console.log(A.staticProperty); // prints TEST
console.log(A.staticMethod("ping")); // prints PING PONG
