import {
  AnnotationContext,
  AnnotationType,
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
  Compile,
  PointcutType,
  on,
} from '@aspectjs/core';
import { Body } from '../annotations/body.annotation';
import {
  FETCH_ANNOTATIONS,
  FetchAnnotationContext,
} from '../annotations/fetch/fetch-annotations';
import { Header } from '../annotations/header.annotation';
import { Headers } from '../annotations/headers.annotation';
import { HttypedClient } from '../annotations/http-client.annotation';
import { PathVariable } from '../annotations/path-variable.annotation';
import { RequestParam } from '../annotations/request-param.annotation';
import { TypeHint } from '../annotations/type.annotation';
import { HttypedClientConfig } from '../client-factory/client-config.type';
import { BodyMetadata } from '../types/body-metadata.type';
import { HttpClassMetadata } from '../types/http-class-metadata.type';
import { HttpEndpointMetadata } from '../types/http-endpoint-metadata.type';
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

    this.setClientConfig(config, clientInstance);
    return clientInstance;
  }

  // Advice methods
  // =====================

  @Before(on.parameters.withAnnotations(Body, RequestParam, PathVariable))
  protected assertIsFetchMethod(ctxt: AdviceContext<PointcutType.PARAMETER>) {
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
    on.classes.withAnnotations(Header, Headers),
    on.methods.withAnnotations(Header, Headers),
    on.parameters.withAnnotations(Body),
    ...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)),
  )
  protected assertIsFetchClient(
    ctxt: AdviceContext<PointcutType.CLASS | PointcutType.METHOD>,
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

  @Compile(
    on.properties.withAnnotations(Header, Headers),
    on.parameters.withAnnotations(Header, Headers),
  )
  protected prohibitWrongTarget(
    ctxt: AdviceContext<PointcutType.CLASS | PointcutType.METHOD>,
  ) {
    throw new AspectError(
      this,
      `Annotations are not allowed: ${ctxt
        .annotations()
        .find()
        .map((a) => `${a}`)}`,
    );
  }

  @AfterReturn(...FETCH_ANNOTATIONS.map((a) => on.methods.withAnnotations(a)))
  protected fetch(ctxt: AfterReturnContext<PointcutType.METHOD>) {
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

    let url = this.replacePathVariables(
      this.joinUrls(endpointConfig.baseUrl, endpointMetadata.url),
      endpointConfig,
      ctxt,
    );

    let requestInit: RequestInit = {
      ...endpointConfig.requestInit,
      method: endpointMetadata.method,
    };
    const body = this.serializeRequestBody(endpointConfig, ctxt);
    if (body !== undefined) {
      requestInit.body = body;
    }

    requestInit.headers = this.getHeadersMetadata(ctxt);

    requestInit = this.applyRequestHandlers(config, {
      ...requestInit,
      url,
    } as Request);
    url = (requestInit as Request).url;

    return this.callHttpAdapter(endpointConfig, url, requestInit).then(
      async (r) => this.applyResponseHandlers(config, r as Response, ctxt),
    );
  }

  // protected methods
  ////////////////////:

  protected override findPathVariables(
    ctxt: AdviceContext<PointcutType, unknown>,
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
    ctxt: AdviceContext<PointcutType.METHOD>,
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
    ctxt: AfterReturnContext<PointcutType.METHOD>,
  ): HeadersInit {
    return ctxt.target.getMetadata(`${ASPECT_ID}:headers`, () => {
      // reverse annotations order in order to let child annotations override parent annotations
      const headerAnnotations = this.findHeaderAnnotations(ctxt).reverse();
      const headersAnnotations = this.findHeadersAnnotations(ctxt).reverse();

      const headers = [
        headersAnnotations.map((a) => ({
          type: a.target.type,
          headers: a.args[0],
        })),
        headerAnnotations.map((a) => ({
          type: a.target.type,
          headers: { [a.args[0]]: a.args[1] },
        })),
      ]
        .flat()
        // sort class annotations first
        .sort((a1, a2) => a1.type - a2.type)
        .reduce((res, { headers }) => {
          return { ...res, ...headers } as HeadersInit;
        }, {} as HeadersInit);

      return headers;
    });
  }

  protected findHeaderAnnotations(
    ctxt: AfterReturnContext<PointcutType.METHOD>,
  ) {
    return getAnnotations(Header)
      .on({
        target: ctxt.target,
        types: [AnnotationType.CLASS, AnnotationType.METHOD],
      })
      .find({
        searchParents: true,
      });
  }
  protected findHeadersAnnotations(
    ctxt: AfterReturnContext<PointcutType.METHOD>,
  ) {
    return getAnnotations(Headers)
      .on({
        target: ctxt.target,
        types: [AnnotationType.CLASS, AnnotationType.METHOD],
      })
      .find({
        searchParents: true,
      });
  }

  /**
   * Extracts the api metadata from the HttpClient annotation
   */

  protected getClassMetadata(
    ctxt: AdviceContext<PointcutType.METHOD>,
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

    // const typeHint =
    // ctxt.annotations(Type).find({ searchParents: true })[0]?.args[0] ??
    // (
    //   bodyAnnotation.target.parent.getMetadata(
    //     'design:paramtypes',
    //   ) as unknown[]
    // )[bodyAnnotation.target.parameterIndex];

    return {
      value: bodyAnnotation.target.eval(),
      typeHint: Object.getPrototypeOf(bodyAnnotation.target.eval()).constructor,
    };
  }

  protected findTypeHintAnnotation(
    ctxt: AdviceContext<PointcutType.METHOD>,
  ): Function | string | undefined {
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
  ): BoundAnnotationContext<AnnotationType.PARAMETER, typeof Body> | undefined {
    const bodyAnnotations: AnnotationContext<
      AnnotationType.PARAMETER,
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
        ctxt.target.type === AnnotationType.PARAMETER
          ? ctxt.target.parent.label
          : ctxt.target.label;

      throw new AspectError(this, `${label} is missing a fetch annotation`);
    }
    return fetchAnnotation;
  }

  protected findHttpClientAnnotation(
    ctxt: AdviceContext,
  ): AnnotationContext<AnnotationType.CLASS, typeof HttypedClient> {
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
