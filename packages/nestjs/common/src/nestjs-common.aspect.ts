import {
  AnnotationMixin,
  Aspect,
  Compile,
  CompileContext,
  on,
} from '@aspectjs/core';
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
import { Body } from './annotations/body.annotation';
import { Controller } from './annotations/controller.annotation';
import { Delete } from './annotations/delete.annotation';
import { Get } from './annotations/get.annotation';
import { Head } from './annotations/head.annotation';
import { Injectable } from './annotations/injectable.annotation';
import { Options } from './annotations/options.annotation';
import { Param } from './annotations/param.annotation';
import { Patch } from './annotations/patch.annotation';
import { Post } from './annotations/post.annotation';
import { Put } from './annotations/put.annotation';
import { Query } from './annotations/query.annotation';

const HTTP_ANNOTATIONS = [
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

    // bridge @aspectjs/nestjs/common annotations
    this.mixin
      .bridge(Get, NGet)
      .bridge(Post, NPost)
      .bridge(Put, NPut)
      .bridge(Patch, NPatch)
      .bridge(Delete, NDelete)
      .bridge(Options, NOptions)
      .bridge(Head, NHead)
      .bridge(Body, NBody)
      .bridge(Param, NParam)
      .bridge(Query, NQuery);

    this.mixin.bridge(Injectable, NInjectable).bridge(Controller, NController);

    this.mixin.createAspect(this);
  }

  /**
   * In case a Controller inherits a parent class, NestJS won't read annotations within the parent.
   * This is infortunate, as makes it not possible with stock decorator to declare an empty parent with proper decorators, and to extend with an actual implementation.
   * As we aliased NestJS decorators to annotations, we use it as an opportunity to apply metadata annotations (`@Get`, `@Param`, ...) found in parent class to the actual child class.
   */
  @Compile(on.classes.withAnnotations(Controller))
  applyMetadataFromParent(ctxt: CompileContext) {}
}
