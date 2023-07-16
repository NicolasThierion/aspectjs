import { AfterReturnContext, PointcutTargetType } from '@aspectjs/core';
import { FetchAdapter } from './fetch-adapter.type';

export class HttpClientRequestHandler {
  private readonly httpBackend: FetchAdapter;

  constructor(httpBackend?: FetchAdapter) {
    // if fetch adapter was not provided, try to assign to fetch in last resort last.
    this.httpBackend = httpBackend ?? fetch;
  }

  doRequest(method: string, url: string, body: BodyInit): RequestInit {
    const requestInit: RequestInit = {
      method,
      body,
    };

    return this.httpBackend(url, requestInit);
  }
  getUrl(context: AfterReturnContext<PointcutTargetType.METHOD>): string {
    return;
  }

  getBody(
    context: AfterReturnContext<PointcutTargetType.METHOD>,
    request: RequestInit,
  ): BodyInit {}
}
