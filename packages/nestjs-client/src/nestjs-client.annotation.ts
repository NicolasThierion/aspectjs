import { AnnotationFactory } from '@aspectjs/common';

export const NestClient = new AnnotationFactory('nestjs-client').create(
  // @ts-ignore
  // eslint-disable @typescript-eslint/no-unused-vars
  function NestClient(host?: string) {},
);
