import type nodeFetch from 'node-fetch';

export type FetchAdapter = typeof fetch | typeof nodeFetch;
