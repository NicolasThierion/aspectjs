import type nodeFetch from 'node-fetch';

/**
 * Defines the HTTP backend to be used by the HttpClientAspect.
 */
export type HttpBackend = typeof fetch | typeof nodeFetch;
