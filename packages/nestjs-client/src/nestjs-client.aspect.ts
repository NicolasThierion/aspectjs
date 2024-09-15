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
    this.mixin.bridge(NestClient, HttypedClient);

    this.mixin
      .bridge(Get, this.httpMethodMixinAdapter(HGet))
      .bridge(Post, this.httpMethodMixinAdapter(HPost))
      .bridge(Patch, this.httpMethodMixinAdapter(HPatch))
      .bridge(Put, this.httpMethodMixinAdapter(HPut))
      .bridge(Delete, this.httpMethodMixinAdapter(HDelete))
      .bridge(Options, this.httpMethodMixinAdapter(HOptions))
      .bridge(Head, this.httpMethodMixinAdapter(HHead));

    this.mixin
      .bridge(Param, this.httpArgumentMixinAdapter(PathVariable))
      .bridge(Query, this.httpArgumentMixinAdapter(RequestParam));

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
