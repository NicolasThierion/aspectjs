/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnnotationFactory } from '@aspectjs/common';

export const NestClient = new AnnotationFactory('nestjs-client').create(
  'NestClient',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  function (host?: string) {},
);
