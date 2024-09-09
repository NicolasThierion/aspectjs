import { AnnotationType } from '@aspectjs/common';
import { HttypedClientConfig } from '../client-factory/client-config.type';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const HttypedClient = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.CLASS,
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function HttypedClient(config?: Partial<HttypedClientConfig> | string) {},
);
