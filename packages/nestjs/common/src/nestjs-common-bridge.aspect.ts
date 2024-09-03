import { AnnotationRef } from '@aspectjs/common';
import { Aspect, DecoratorBridgeAspect } from '@aspectjs/core';
import {
  Body as NBody,
  Controller as NController,
  Delete as NDelete,
  Get as NGet,
  Head as NHead,
  Injectable as NInjectable,
  Options as NOptions,
  Patch as NPatch,
  Post as NPost,
  Put as NPut,
} from '@nestjs/common';
import { Body } from './annotations/body.annotation';
import { Controller } from './annotations/controller.annotation';
import { Delete } from './annotations/delete.annotation';
import { Get } from './annotations/get.annotation';
import { Head } from './annotations/head.annotation';
import { Injectable } from './annotations/injectable.annotation';
import { Options } from './annotations/options.annotation';
import { Patch } from './annotations/patch.annotation';
import { Post } from './annotations/post.annotation';
import { Put } from './annotations/put.annotation';
@Aspect('@aspectjs/nestjs:common-bridge')
export class NestJSCommonBridgeAspect extends DecoratorBridgeAspect {
  constructor() {
    super();

    // bridge @aspectjs/http-client annotations
    this.bridge(AnnotationRef.of('aspectjs.http', 'Get'), NGet)
      .bridge(AnnotationRef.of('aspectjs.http', 'Post'), NPost)
      .bridge(AnnotationRef.of('aspectjs.http', 'Put'), NPut)
      .bridge(AnnotationRef.of('aspectjs.http', 'Patch'), NPatch)
      .bridge(AnnotationRef.of('aspectjs.http', 'Delete'), NDelete)
      .bridge(AnnotationRef.of('aspectjs.http', 'Options'), NOptions)
      .bridge(AnnotationRef.of('aspectjs.http', 'Head'), NHead)
      .bridge(AnnotationRef.of('aspectjs.http', 'Body'), NBody);

    // bridge @aspectjs/nestjs/common annotations
    this.bridge(Get, NGet)
      .bridge(Post, NPost)
      .bridge(Put, NPut)
      .bridge(Patch, NPatch)
      .bridge(Delete, NDelete)
      .bridge(Options, NOptions)
      .bridge(Head, NHead)
      .bridge(Body, NBody);

    this.bridge(Injectable, NInjectable).bridge(Controller, NController);
  }
}
