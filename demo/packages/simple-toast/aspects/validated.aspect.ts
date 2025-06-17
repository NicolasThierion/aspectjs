import {
  AnnotationKind,
  BoundAnnotationContext,
  getAnnotations,
} from '@aspectjs/common';
import {
  Aspect,
  Before,
  BeforeContext,
  PointcutKind,
  on,
} from '@aspectjs/core';
import { Email } from '../annotations/email.annotation';
import { MinLength } from '../annotations/min-length.annotation';
import { NotBlank } from '../annotations/not-blank.annotation';
import { Validated } from '../annotations/validated.annotation';

@Aspect()
export class ValidatedAspect {
  @Before(on.parameters.withAnnotations(Validated))
  validate(ctxt: BeforeContext<PointcutKind.PARAMETER>, args: unknown[]) {
    // find all @Validated() annotation on parameters
    const validatedAnnotations = ctxt.annotations(Validated).find();

    // get each parameter annotated with @Validated
    const validatedParameters = validatedAnnotations
      .map((annotation) => annotation.target.eval() as object)
      .filter((value) => typeof value === 'object');

    // for each @Validated() parameters
    validatedParameters.forEach((value) => {
      // find all @MinLength annotations
      getAnnotations(MinLength)
        .onProperty(value)
        .find()
        // validate all attributes annotated with @MinLength()
        .forEach(this.validateMinLength);

      // find all @NotBlank annotations
      getAnnotations(NotBlank)
        .onProperty(value)
        .find()
        // validate all attributes annotated with @NotBlank()
        .forEach(this.validateNotBlank);

      // find all @Email annotations
      getAnnotations(Email)
        .onProperty(value)
        .find()
        // validate all attributes annotated with @NotBlank()
        .forEach(this.validateEmail);
    });

    validatedAnnotations.forEach((a) => {
      console.log(`${a} is valid`);
    });
  }
  validateMinLength(
    annotation: BoundAnnotationContext<
      AnnotationKind.PROPERTY,
      typeof MinLength
    >
  ) {
    const value = annotation.target.eval() as string;
    if (value?.length < annotation.args[0]) {
      throw new Error(
        `${annotation.ref} failed on ${annotation.target.label} (value: ${value})`
      );
    }
  }

  validateNotBlank(
    annotation: BoundAnnotationContext<AnnotationKind.PROPERTY, typeof NotBlank>
  ) {
    const value = annotation.target.eval() as string;
    if (value === '' || value === undefined || value === null) {
      throw new Error(
        `${annotation.ref} failed on ${annotation.target.label} (value: ${value})`
      );
    }
  }

  validateEmail(
    annotation: BoundAnnotationContext<AnnotationKind.PROPERTY, typeof Email>
  ) {
    const value = annotation.target.eval() as string;
    if (!value?.match(/.+@.+\..+/)) {
      throw new Error(
        `${annotation.ref} failed on ${annotation.target.label} (value: ${value})`
      );
    }
  }
}
