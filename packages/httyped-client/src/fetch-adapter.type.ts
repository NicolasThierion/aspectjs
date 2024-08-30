import type nodeFetch from 'node-fetch';

/**
 * Defines the HTTP backend to be used by the HttpClientAspect.
 */
export type FetchAdapter = typeof fetch | typeof nodeFetch;
