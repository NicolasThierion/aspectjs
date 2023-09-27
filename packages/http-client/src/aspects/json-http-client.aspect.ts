import { Aspect } from '@aspectjs/core';
import { HttpClientAspect } from './http-client.aspect';

@Aspect()
export class JsonHttpClientAspect extends HttpClientAspect {}
