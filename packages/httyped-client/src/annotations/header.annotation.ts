import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const Header = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function Header(headerName: string, value: string | string[]) {},
);
