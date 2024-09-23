import { AnnotationMixin, Aspect, AspectError } from '@aspectjs/core';
import {
  Delete,
  Get,
  Head,
  Options,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@aspectjs/nestjs/common';
import {
  Delete as HDelete,
  Get as HGet,
  Head as HHead,
  Options as HOptions,
  Patch as HPatch,
  Post as HPost,
  Put as HPut,
  HttypedClient,
  HttypedClientAspect,
  PathVariable,
  RequestParam,
} from 'httyped-client';
import { NestClient } from './nestjs-client.annotation';

@Aspect('ajs:nest-client')
export class NestClientAspect extends HttypedClientAspect {
  private readonly mixin = new AnnotationMixin();

  constructor() {
    super();
    this.mixin.bind(NestClient, HttypedClient);

    this.mixin
      .bind(Get, this.httpMethodMixinAdapter(HGet))
      .bind(Post, this.httpMethodMixinAdapter(HPost))
      .bind(Patch, this.httpMethodMixinAdapter(HPatch))
      .bind(Put, this.httpMethodMixinAdapter(HPut))
      .bind(Delete, this.httpMethodMixinAdapter(HDelete))
      .bind(Options, this.httpMethodMixinAdapter(HOptions))
      .bind(Head, this.httpMethodMixinAdapter(HHead));

    this.mixin
      .bind(Param, this.httpArgumentMixinAdapter(PathVariable))
      .bind(Query, this.httpArgumentMixinAdapter(RequestParam));

    this.mixin.createAspect(this);
  }

  private httpArgumentMixinAdapter(annotation: typeof PathVariable) {
    return (...args: any[]) => {
      if (args.length > 1) {
        throw new AspectError(
          this,
          `Annotation ${annotation.ref} is only supported when called with a single string argument`,
        );
      }
      const variable = args[0] as string;
      return annotation(variable);
    };
  }

  private httpMethodMixinAdapter(
    annotation:
      | typeof HGet
      | typeof HPost
      | typeof HPut
      | typeof HPatch
      | typeof HDelete
      | typeof HOptions
      | typeof HHead,
  ) {
    return (path: string | string[] | undefined) =>
      annotation(
        [path]
          .flat()
          .filter((p) => p !== undefined)
          .join('/'),
      );
  }
}