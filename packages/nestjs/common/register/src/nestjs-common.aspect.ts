import { AnnotationMixin, Aspect, Compile, on } from '@aspectjs/core';

import {
  Annotation,
  AnnotationContext,
  AnnotationKind,
} from '@aspectjs/common';
import type { CompileContext } from '@aspectjs/core';
import {
  Body,
  Controller,
  Delete,
  Get,
  Head,
  Injectable,
  Options,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@aspectjs/nestjs/common';
import {
  Body as NBody,
  Controller as NController,
  Delete as NDelete,
  Get as NGet,
  Head as NHead,
  Injectable as NInjectable,
  Options as NOptions,
  Param as NParam,
  Patch as NPatch,
  Post as NPost,
  Put as NPut,
  Query as NQuery,
} from '@nestjs/common';

const HTTP_ANNOTATIONS: [Annotation, any][] = [
  [Get, NGet],
  [Post, NPost],
  [Put, NPut],
  [Patch, NPatch],
  [Delete, NDelete],
  [Options, NOptions],
  [Head, NHead],
  [Body, NBody],
  [Param, NParam],
  [Query, NQuery],
];
@Aspect('ajs.nestjs:common-mixin')
export class NestCommonAspect {
  private readonly mixin = new AnnotationMixin();

  constructor() {
    // 'NestCommonMixin'

    // bind @aspectjs/nestjs/common annotations
    this.mixin
      .bind(Get, NGet)
      .bind(Post, NPost)
      .bind(Put, NPut)
      .bind(Patch, NPatch)
      .bind(Delete, NDelete)
      .bind(Options, NOptions)
      .bind(Head, NHead)
      .bind(Body, NBody)
      .bind(Param, NParam)
      .bind(Query, NQuery);

    this.mixin
      .bind(Injectable, NInjectable)
      .bind(Controller as any, NController);

    this.mixin.createAspect(this);
  }

  /**
   * In case a Controller inherits a parent class, NestJS won't read annotations within the parent.
   * This is infortunate, as makes it not possible with stock decorators to declare an empty parent with proper decorators, and to extend with an actual implementation.
   * As we aliased NestJS decorators to annotations, we use it as an opportunity to apply metadata annotations (`@Get`, `@Param`, ...) found in parent class to the actual child class.
   */
  @Compile(on.classes.withAnnotations(Controller))
  applyMetadataFromParent(ctxt: CompileContext) {
    HTTP_ANNOTATIONS.forEach(
      ([annotation, nestDecorator]: [Annotation, any]) => {
        ctxt
          .annotations(annotation)
          .find({ searchParents: true })
          .filter((c) => {
            // get only annotations on parents
            return c.target.declaringClass !== ctxt.target.declaringClass;
          })
          .forEach((c: AnnotationContext<AnnotationKind.PARAMETER>) => {
            const childDescriptor = Object.getOwnPropertyDescriptor(
              ctxt.target.proto,
              c.target.propertyKey,
            );
            if (childDescriptor) {
              // take only methods that are defined in the current class
              nestDecorator(...c.args)(
                ctxt.target.proto,
                c.target.propertyKey,
                c.target.parameterIndex ?? childDescriptor,
              );
            }
          });
      },
    );
  }
}
