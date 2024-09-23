/* eslint-disable @typescript-eslint/no-unused-vars */
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const Header = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  'Header',
  function (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    headerName: string,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    value: string | string[],
  ) {},
);
