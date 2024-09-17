/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnnotationFactory } from '@aspectjs/common';

export const NestClient = new AnnotationFactory('nestjs-client').create(
  function NestClient(host?: string) {},
);
