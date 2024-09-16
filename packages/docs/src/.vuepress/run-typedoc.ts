import { findUpSync } from 'find-up';
import { dirname, join } from 'path';
import * as url from 'url';
import { configureTypedoc } from './typedoc/typedoc.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const rootFolder = dirname(
  findUpSync('package.json', {
    cwd: join(dirname(findUpSync('package.json', { cwd: __dirname })!), '..'),
  })!,
);

export const TYPEDOC_ENTRYPOINTS = [
  `${rootFolder}/packages/core/index.ts`,
  `${rootFolder}/packages/common/index.ts`,
  `${rootFolder}/packages/memo/index.ts`,
  `${rootFolder}/packages/persistence/index.ts`,
];

await configureTypedoc(TYPEDOC_ENTRYPOINTS).generateDocs();
