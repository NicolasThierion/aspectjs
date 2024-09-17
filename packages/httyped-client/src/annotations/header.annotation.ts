/* eslint-disable @typescript-eslint/no-unused-vars */
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const Header = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(function Header(
  headerName: string,
  value: string | string[],
) {});
