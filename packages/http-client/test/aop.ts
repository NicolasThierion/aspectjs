import { getWeaver } from '@aspectjs/core';
import { JsonHttpClientAspect } from '../src/aspects/json-http-client.aspect';

getWeaver().enable(new JsonHttpClientAspect());
