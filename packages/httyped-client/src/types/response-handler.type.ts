import { AfterReturnContext, PointcutKind } from '@aspectjs/core';
import { HttypedClientConfig } from '../client-factory/client-config.type';

export type ResponseHandler = (
  response: Response,
  config: Readonly<Required<HttypedClientConfig>>,
  ctxt: AfterReturnContext<PointcutKind.METHOD>,
) => Promise<unknown>;
