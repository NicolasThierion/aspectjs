import {
  AnnotationContext,
  AnnotationKind,
  AnnotationTarget,
  BoundAnnotationContext,
  getAnnotations,
} from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import {
  AdviceContext,
  AfterReturn,
  AfterReturnContext,
  Aspect,
  AspectError,
  Before,
  PointcutKind,
  on,
} from '@aspectjs/core';
import { Body } from '../annotations/body.annotation';
import {
  FETCH_ANNOTATIONS,
  FetchAnnotationContext,
} from '../annotations/fetch/fetch-annotations';
import { Header } from '../annotations/header.annotation';
import { Headers as _Headers } from '../annotations/headers.annotation';
import { HttypedClient } from '../annotations/http-client.annotation';
import { PathVariable } from '../annotations/path-variable.annotation';
import { RequestParam } from '../annotations/request-param.annotation';
import { RequestParams } from '../annotations/request-params.annotation';
import { TypeHint } from '../annotations/type.annotation';
import { HttypedClientConfig } from '../client-factory/client-config.type';
import {
  MissingPathVariableError,
  PathVariableNotMatchedError,
} from '../client-factory/path-variables-handler.type';
import { BodyMetadata } from '../types/body-metadata.type';
import { HttpClassMetadata } from '../types/http-class-metadata.type';
import { HttpEndpointMetadata } from '../types/http-endpoint-metadata.type';
import { TypeHintType } from '../types/type-hint.type';
import '../url-canparse.polyfill';
import { AbstractAopHttpClientAspect } from './abstract-aop-http-client.aspect';

const ASPECT_ID = 'ajs.httyped-client';
@Aspect(ASPECT_ID)
export class HttypedClientAspect extends AbstractAopHttpClientAspect {
  constructor() {
    super(ASPECT_ID);
  }

  // Public methods
  // =====================
  addClient<T>(clientInstance: T, config: Required<HttypedClientConfig>): T {
    const ctor = Object.getPrototypeOf(clientInstance).constructor;
    const httypedAnnotation = getAnnotations(HttypedClient)
      .onClass(ctor)
      .find({ searchParents: true });

    if (!httypedAnnotation.length) {
      throw new AspectError(
        this,
        `class ${ctor.name} is missing the ${HttypedClient} annotation`,
      );
    }

    this.setClientConfig(clientInstance, config);
    return clientInstance;
  }

  // Advice methods
  // =====================

  @Before(
    on.parameters.withAnnotations(
      Body,
      RequestParam,
      RequestParams,
      PathVariable,
    ),
  )
  protected assertIsFetchMethod(ctxt: AdviceContext<PointcutKind.PARAMETER>) {
    ctxt.target.getMetadata(`${ASPECT_ID}:assertBodyImpliesFetch`, () => {
      if (!this.findHttpMethodAnnotation(ctxt)) {
        throw new AspectError(
          this,
          `${ctxt.target.label} is missing a fetch annotation`,
        );
      }
      return true;
    });
  }

  @Before(
    on.classes.withAnnotations(Header, _Headers),
    on.methods.withAnnotations(Header, _Headers),
    on.parameters.withAnnotations(Body),
    ...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)),
  )
  protected assertIsFetchClient(
    ctxt: AdviceContext<PointcutKind.CLASS | PointcutKind.METHOD>,
  ) {
    ctxt.target.getMetadata(`${ASPECT_ID}:assertHeaderImpliesClient`, () => {
      if (!this.findHttpClientAnnotation(ctxt)) {
        throw new AspectError(
          this,
          `${ctxt.target.declaringClass.label} is missing a ${HttypedClient} annotation`,
        );
      }
      return true;
    });
  }

  @Before(
    on.properties.withAnnotations(Header, _Headers),
    on.parameters.withAnnotations(Header, _Headers),
  )
  protected prohibitWrongTarget(
    ctxt: AdviceContext<PointcutKind.CLASS | PointcutKind.METHOD>,
  ) {
    throw new AspectError(
      this,
      `Annotations are not allowed: ${ctxt
        .annotations(Header, _Headers)
        .find()
        .map((a) => `${a}`)}`,
    );
  }

  @AfterReturn(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  protected fetch(ctxt: AfterReturnContext<PointcutKind.METHOD>) {
    if (!this.isManagedInstance(ctxt.instance!)) {
      // not received a client config = not created through the HttypedClientFactory.
      return;
    }
    let config = this.getClientConfig(ctxt.instance!);

    const endpointMetadata = this.getEndpointMetadata(ctxt);
    const classMetadata = this.getClassMetadata(ctxt);

    const endpointConfig = this.mergeConfig(
      config,
      classMetadata,
      endpointMetadata,
    );

    let url = this.joinUrls(endpointConfig.baseUrl, endpointMetadata.url);
    try {
      url = super.handleUrl(endpointConfig, ctxt, url);

      let request: Request = new Request(url, {
        ...endpointConfig.requestInit,
        headers: new Headers({
          ...(endpointConfig.requestInit?.headers ?? {}),
          ...this.getHeadersMetadata(ctxt),
        }),
        body: this.serializeRequestBody(endpointConfig, ctxt),
        signal: undefined,
        method: endpointMetadata.method,
      } satisfies Partial<RequestInit> as any);

      request = this.applyRequestHandlers(config, request);
      url = (request as Request).url;

      return this.callHttpAdapter(endpointConfig, request).then(async (r) =>
        this.applyResponseHandlers(config, r as Response, ctxt),
      );
    } catch (e) {
      if (e instanceof MissingPathVariableError) {
        throw new AspectError(
          this,
          `${PathVariable}(${e.variable}) parameter is missing for ${ctxt.target.label}`,
        );
      } else if (e instanceof PathVariableNotMatchedError) {
        throw new AspectError(
          this,
          `${PathVariable}(${e.variable}) parameter of ${ctxt.target.label} does not match url ${url}`,
        );
      } else {
        throw e;
      }
    }
  }

  // protected methods
  ////////////////////:

  protected override findRequestParams(
    ctxt: AdviceContext<PointcutKind, unknown>,
  ): [string, unknown][] {
    const requestParamsAnnotations = ctxt
      .annotations(RequestParams)
      .find({ searchParents: true })
      .map(
        (annotation) =>
          annotation.target.eval() as Record<string, any> | Map<string, any>,
      )
      .flatMap((params) => {
        if (params === null || params === undefined) {
          return [];
        }
        if (params instanceof Map) {
          return [...params.entries()];
        } else if (typeof params === 'object') {
          return Object.entries(params);
        } else {
          throw new TypeError(
            `Argument annotated with ${RequestParams} on ${
              ctxt.target.label
            } cannot be of type ${typeof params}`,
          );
        }
      });

    const requestParamAnnotations = ctxt
      .annotations(RequestParam)
      .find({ searchParents: true })
      // sort first parameters first
      .sort(
        (a1, a2) =>
          (a1.target as AnnotationTarget<AnnotationKind.PARAMETER>)
            .parameterIndex -
          (a2.target as AnnotationTarget<AnnotationKind.PARAMETER>)
            .parameterIndex,
      )
      .map((annotation) => {
        const [name] = annotation.args;
        const value = annotation.target.eval();
        return [name, value] as [string, unknown];
      });

    return [...requestParamsAnnotations, ...requestParamAnnotations];
  }

  protected override findPathVariables(
    ctxt: AdviceContext<PointcutKind, unknown>,
  ): Record<string, any> {
    return ctxt
      .annotations(PathVariable)
      .find({ searchParents: true })
      .reduce(
        (variables, annotation) => {
          if (Object.getOwnPropertyDescriptor(variables, annotation.args[0])) {
            throw new AspectError(
              this,
              `${PathVariable}(${annotation.args[0]}) is specified twice for ${ctxt.target.label}`,
            );
          }
          return {
            ...variables,
            [annotation.args[0]]: annotation.target.eval(),
          };
        },
        {} as Record<string, any>,
      );
  }

  /**
   * Extracts the endpoint metadata from the fetch annotation
   */
  protected override getEndpointMetadata(
    ctxt: AdviceContext<PointcutKind.METHOD>,
  ): HttpEndpointMetadata {
    return ctxt.target.getMetadata<HttpEndpointMetadata>(
      `${ASPECT_ID}:endpoint`,
      () => {
        const fetchAnnotation = this.findHttpMethodAnnotation(ctxt)!;

        let url = fetchAnnotation.args[0] ?? '';

        const metadata = {
          url,
          method:
            fetchAnnotation.ref.name.toLowerCase() as HttpEndpointMetadata['method'],
          requestInit: fetchAnnotation.args[1],
        };

        ctxt.target.defineMetadata(`${ASPECT_ID}:endpoint`, metadata);

        assert(!!metadata);
        return metadata!;
      },
    );
  }

  protected getHeadersMetadata(
    ctxt: AfterReturnContext<PointcutKind.METHOD>,
  ): HeadersInit {
    return ctxt.target.getMetadata(`${ASPECT_ID}:headers`, () => {
      // reverse annotations order in order to let child annotations override parent annotations
      const headerAnnotations = this.findHeaderAnnotations(ctxt).reverse();
      const headersAnnotations = this.findHeadersAnnotations(ctxt).reverse();

      const headers = [
        headersAnnotations.map((a) => ({
          kind: a.target.kind,
          headers: a.args[0],
        })),
        headerAnnotations.map((a) => ({
          kind: a.target.kind,
          headers: { [a.args[0]]: a.args[1] },
        })),
      ]
        .flat()
        // sort class annotations first
        .sort((a1, a2) => a1.kind - a2.kind)
        .reduce((res, { headers }) => {
          return { ...res, ...headers } as HeadersInit;
        }, {} as HeadersInit);

      return headers;
    });
  }

  protected findHeaderAnnotations(
    ctxt: AfterReturnContext<PointcutKind.METHOD>,
  ) {
    return getAnnotations(Header)
      .on({
        target: ctxt.target,
        types: [AnnotationKind.CLASS, AnnotationKind.METHOD],
      })
      .find({
        searchParents: true,
      });
  }
  protected findHeadersAnnotations(
    ctxt: AfterReturnContext<PointcutKind.METHOD>,
  ) {
    return getAnnotations(_Headers)
      .on({
        target: ctxt.target,
        types: [AnnotationKind.CLASS, AnnotationKind.METHOD],
      })
      .find({
        searchParents: true,
      });
  }

  /**
   * Extracts the api metadata from the HttpClient annotation
   */

  protected getClassMetadata(
    ctxt: AdviceContext<PointcutKind.METHOD>,
  ): HttpClassMetadata {
    let metadata = ctxt.target.declaringClass.getMetadata<HttpClassMetadata>(
      `${ASPECT_ID}:class`,
    );

    if (metadata) {
      return metadata!;
    }

    const httpClientAnnotation = this.findHttpClientAnnotation(ctxt);
    const [arg] = httpClientAnnotation!.args;
    metadata =
      typeof arg === 'string'
        ? {
            baseUrl: arg,
          }
        : arg ?? {};
    `${ASPECT_ID}:class`;
    return metadata!;
  }

  protected findRequestBodyMetadata(
    ctxt: AdviceContext,
  ): BodyMetadata | undefined {
    const bodyAnnotation = this.findBodyAnnotation(ctxt);
    if (bodyAnnotation === undefined) {
      return;
    }

    const typeHint = bodyAnnotation.target
      .annotations(TypeHint)
      .find({ searchParents: true })[0]?.args[0];
    // ??
    // (
    //   bodyAnnotation.target.declaringClass.getMetadata(
    //     'design:paramtypes',
    //   ) as unknown[]
    // )[bodyAnnotation.target.parameterIndex];

    return {
      value: bodyAnnotation.target.eval(),
      typeHint:
        typeHint ??
        Object.getPrototypeOf(bodyAnnotation.target.eval()).constructor,
    };
  }

  protected findTypeHintAnnotation(
    ctxt: AdviceContext<PointcutKind.METHOD>,
  ): TypeHintType | TypeHintType[] | undefined {
    return ctxt.annotations(TypeHint).find({ searchParents: true })[0]?.args[0];
  }

  /**
   * Extracts the method body from metadata
   * @param config The config of the HttpClientAspect
   * @param ctxt the advice context
   * @returns the method body metadata
   */
  protected findBodyAnnotation(
    ctxt: AdviceContext,
  ): BoundAnnotationContext<AnnotationKind.PARAMETER, typeof Body> | undefined {
    const bodyAnnotations: AnnotationContext<
      AnnotationKind.PARAMETER,
      typeof Body
    >[] = ctxt.annotations(Body).find({ searchParents: true });

    if (bodyAnnotations.length > 1) {
      if (ctxt.annotations(Body).find({ searchParents: false }).length > 1) {
        throw new AspectError(
          this,
          `${ctxt.target.label} is annotated by more that one ${Body} annotations}`,
        );
      }
    }

    return bodyAnnotations[0];
  }

  protected findHttpMethodAnnotation(
    ctxt: AdviceContext,
  ): FetchAnnotationContext {
    const fetchAnnotations = ctxt
      .annotations(...FETCH_ANNOTATIONS)
      .find({ searchParents: true });

    if (fetchAnnotations.length > 1) {
      if (
        ctxt.annotations(...FETCH_ANNOTATIONS).find({ searchParents: false })
          .length > 1
      ) {
        throw new AspectError(
          this,
          `${
            ctxt.target.label
          } is annotated by more that one fetch annotations: ${fetchAnnotations.join(
            ',',
          )}`,
        );
      }
    }

    const fetchAnnotation = fetchAnnotations[0];

    if (!fetchAnnotation) {
      const label =
        ctxt.target.kind === AnnotationKind.PARAMETER
          ? ctxt.target.declaringMethod.label
          : ctxt.target.label;

      throw new AspectError(this, `${label} is missing a fetch annotation`);
    }
    return fetchAnnotation;
  }

  protected findHttpClientAnnotation(
    ctxt: AdviceContext,
  ): AnnotationContext<AnnotationKind.CLASS, typeof HttypedClient> {
    const [httpClientAnnotation] = ctxt
      .annotations(HttypedClient)
      .find({ searchParents: true });

    if (!httpClientAnnotation) {
      throw new AspectError(
        this,
        `${ctxt.target.declaringClass} is missing the ${HttypedClient} annotation`,
      );
    }
    return httpClientAnnotation;
  }
}
