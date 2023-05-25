// @ts-check
/* eslint-env node */

import { resolve } from 'path';
import { JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';

import { readFileSync } from 'fs';
import { parse } from 'json5';
import { join } from 'path';

const tsconfig = parse(
  readFileSync(join(__dirname, './tsconfig.json')).toString(),
);

const { compilerOptions } = tsconfig;

const pathsConfig = Object.entries(compilerOptions.paths ?? {}).reduce(
  (pathsConfig: any, [alias, paths]: [any, any]) => {
    pathsConfig[alias] = ([] as string[])
      .concat(paths)
      .map((p) => resolve(__dirname, p));
    return pathsConfig;
  },
  {},
);

/**
 * An object with Jest options.
 * @type {import('@jest/types').Config.InitialOptions}
 */
export default {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  preset: 'ts-jest',
  transform: {
    '^.+.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
      },
    ],
  },
  // rootDir: module.parent.path,
  moduleNameMapper: pathsToModuleNameMapper(pathsConfig),
  resolver: 'ts-jest-resolver',
  verbose: true,
  coverageDirectory: join(__dirname, 'dist', 'coverage'),
  // collectCoverage: true,
} satisfies JestConfigWithTsJest;
