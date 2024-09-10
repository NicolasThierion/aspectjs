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

@Aspect('nestjs-client')
export class NestClientMixin extends AnnotationMixin {
  constructor() {
    super('NestClientMixin');
    this.bridge(NestClient, HttypedClient);

    this.bridge(Get, this.httpMethodAdapter(HGet))
      .bridge(Post, this.httpMethodAdapter(HPost))
      .bridge(Patch, this.httpMethodAdapter(HPatch))
      .bridge(Put, this.httpMethodAdapter(HPut))
      .bridge(Delete, this.httpMethodAdapter(HDelete))
      .bridge(Options, this.httpMethodAdapter(HOptions))
      .bridge(Head, this.httpMethodAdapter(HHead));

    this.bridge(Param, this.httpArgumentAdapter(PathVariable)).bridge(
      Query,
      this.httpArgumentAdapter(RequestParam),
    );
  }

  override createAspect(): HttypedClientAspect {
    return super.createAspect() as any as HttypedClientAspect;
  }
  protected override createAspectTemplate(): HttypedClientAspect {
    @Aspect('NestClientMixin')
    class NestClientAspect extends HttypedClientAspect {}

    return new NestClientAspect() as any;
  }
  private httpArgumentAdapter(annotation: typeof PathVariable) {
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

  private httpMethodAdapter(
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
