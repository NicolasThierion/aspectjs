import { AfterReturnContext, PointcutType } from '@aspectjs/core';
import { HttypedClientConfig } from '../client-factory/client-config.type';

export type ResponseHandler = (
  response: Response,
  config: Readonly<Required<HttypedClientConfig>>,
  ctxt: AfterReturnContext<PointcutType.METHOD>,
) => Promise<unknown>;
