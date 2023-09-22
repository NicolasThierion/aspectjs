// @ts-check
/* eslint-env node */

import { resolve } from 'path';
import { JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';

import findUp from 'find-up';
import { readFileSync } from 'fs';
import { parse } from 'json5';
import { dirname, join } from 'path';
export const createJestConfig = (config?: {
  rootDir?: string;
  tsconfig?: string;
}): JestConfigWithTsJest => {
  const rootDir = config?.rootDir ?? __dirname;

  const tsconfigPath =
    config?.tsconfig ??
    findUp.sync(['tsconfig.spec.json', 'tsconfig.json'], {
      cwd: rootDir,
    })!;
  const tsconfig = parse(readFileSync(tsconfigPath).toString());
  const pathsConfig = getPathAliases(rootDir, tsconfig);
  return {
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
    verbose: true,
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
    modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.*/dist/'],
    moduleNameMapper: pathsToModuleNameMapper(pathsConfig),
    resolver: 'ts-jest-resolver',

    coverageDirectory: join(__dirname, 'dist', 'coverage'),
    collectCoverage: false, // disabled, as it slows down running test with vscode-jest extension
  } satisfies JestConfigWithTsJest;
};

/**
 * An object with Jest options.
 * @type {import('@jest/types').Config.InitialOptions}
 */
export default createJestConfig();

function getPathAliases(rootDir: string, tsconfig: any) {
  const { compilerOptions } = tsconfig;

  const parentAliases: any = tsconfig.extends
    ? getPathAliases(
        dirname(tsconfig.extends),
        parse(readFileSync(tsconfig.extends).toString()),
      )
    : {};
  const aliases = Object.entries(compilerOptions?.paths ?? {})
    .map(([alias, paths]) => {
      if (alias === '*') {
        alias = '<rootDir>';
      }
      return [alias, paths] as [string, string[]];
    })
    .reduce((pathsConfig: any, [alias, paths]: [any, any]) => {
      pathsConfig[alias] = ([] as string[])
        .concat(paths)
        .map((p) => resolve(rootDir, p));
      return pathsConfig;
    }, {});

  return {
    ...parentAliases,
    ...aliases,
  };
}
