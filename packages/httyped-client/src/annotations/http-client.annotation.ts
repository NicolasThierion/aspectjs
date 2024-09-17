/* eslint-disable @typescript-eslint/no-unused-vars */

import { AnnotationKind } from '@aspectjs/common';
import { HttypedClientConfig } from '../client-factory/client-config.type';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const HttypedClient = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationKind.CLASS,
  function HttypedClient(config?: Partial<HttypedClientConfig> | string) {},
);
