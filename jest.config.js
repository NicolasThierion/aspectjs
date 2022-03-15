// @ts-check
/* eslint-env node */
require('require-json5').replace();
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');
const { resolve } = require('path');
const pathsConfig = Object.entries(compilerOptions.paths).reduce(
  (pathsConfig, [alias, paths]) => {
    pathsConfig[alias] = [].concat(paths).map((p) => resolve(__dirname, p));
    return pathsConfig;
  },
  {}
);
/**
 * An object with Jest options.
 * @type {import('@jest/types').Config.InitialOptions}
 */
const options = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.spec.json',
    },
  },
  // rootDir: module.parent.path,
  moduleNameMapper: pathsToModuleNameMapper(pathsConfig),
  resolver: 'ts-jest-resolver',
  verbose: true,
};

module.exports = options;
