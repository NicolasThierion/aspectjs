import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import findUp from 'find-up';
import { existsSync, readFileSync } from 'fs';
import json5 from 'json5';
import { dirname, join, relative, resolve } from 'path';
import type { OutputOptions, RollupOptions } from 'rollup';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
const { parse } = json5;

import { defineConfig as rollupDefineConfig } from 'rollup';

// This file was created with the help of  https://github.com/VitorLuizC/typescript-library-boilerplate
interface PackageJson {
  name: string;
  version: string;
  author: string;
  license: string;
}

export interface CreateConfigOptions {
  pkg?: PackageJson;
  tsconfig?: string;

  rootDir?: string;
  input?: string;
  typesInput?: string;
}

export const createConfig = (
  optionsOrRootDir: string | CreateConfigOptions,
) => {
  const options =
    typeof optionsOrRootDir === 'string'
      ? {
          rootDir: optionsOrRootDir,
        }
      : optionsOrRootDir;
  options.rootDir = options.rootDir ?? '.';
  options.input = options.input ?? join(options.rootDir, 'index.ts');

  const localTsConfig = [
    'tsconfig.lib.json',
    'tsconfig.app.json',
    'tsconfig.json',
  ]
    .map((tsconfig) => join(options.rootDir ?? '.', tsconfig))
    .filter((tsconfig) => existsSync(tsconfig))[0]!;

  options.tsconfig =
    options.tsconfig ??
    (existsSync(localTsConfig)
      ? localTsConfig
      : resolve(__dirname, './tsconfig.json'));

  let name!: string;
  let subExportsPath!: string;
  const packageJsonPath = findUp.sync('package.json', {
    cwd: options.rootDir,
  })!;

  if (!options.pkg) {
    name = relative(dirname(packageJsonPath), options.rootDir);
    subExportsPath = name;

    options.pkg = parse(readFileSync(packageJsonPath).toString());
  }

  if (!name) {
    name = options.pkg!.name.split('/').splice(-1)[0]!;
    subExportsPath = '';
  }

  const pkg = options.pkg!;
  const external = [
    '@aspectjs/common',
    '@aspectjs/common/testing',
    '@aspectjs/common/utils',
    '@aspectjs/core',
  ];

  // const external = (moduleId: string) => {
  //   return !moduleId.startsWith('.') && !moduleId.startsWith('');
  // };
  /**
   * Comment with library information to be appended in the generated bundles.
   */
  const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${pkg.author}
 * Released under the ${pkg.license} License.
 */
`;

  /**
   * Creates an output options object for Rollup.js.
   * @param {import('rollup').OutputOptions} options
   * @returns {import('rollup').OutputOptions}
   */
  function createOutputOptions(options: Partial<OutputOptions>): OutputOptions {
    return {
      banner,
      name,
      exports: 'named',
      sourcemap: true,
      ...options,
      globals: {
        '@aspectjs/common': 'aspectjs-common',
        '@aspectjs/common/testing': 'aspectjs-common-testing',
        '@aspectjs/common/utils': 'aspectjs-common-utils',
        '@aspectjs/core': 'aspectjs-core',
      },
    };
  }

  /**
   * @type {import('rollup').RollupOptions}
   */
  const bundleOptions = {
    input: options.input,
    output: [
      // CommonJS
      createOutputOptions({
        file: `./dist/cjs/${name}.cjs`,
        format: 'cjs',
      }),
      // ES 2020
      createOutputOptions({
        dir: `./dist/esm2020/`,
        format: 'esm',
        preserveModules: true,
      }),
      // FESM2020
      createOutputOptions({
        file: `./dist/fesm2020/${name}.mjs`,
        format: 'esm',
        preserveModules: false,
      }),
      // UMD
      createOutputOptions({
        file: `./dist/bundles/${name}.umd.js`,
        format: 'umd',
      }),
      // UMD min
      createOutputOptions({
        file: `./dist/bundles/${name}.umd.min.js`,
        format: 'umd',
        plugins: [terser()],
      }),
    ],

    plugins: [
      typescript({
        // cacheDir: '.rollup.tscache',
        tsconfig: options.tsconfig,
        // explicitly disable declarations, as a rollup config is dedicated for them
        declaration: false,
        declarationDir: undefined,
        declarationMap: undefined,
        module: 'esnext',
      }),
    ],
    external,
  } satisfies RollupOptions;

  /**
   * Generate only types into dist/types/index.d.ts
   */
  const dtsOutput = bundleOptions.output[0]!;
  const dtsOptions: RollupOptions = {
    input: options.input,

    // .d.ts
    output: dtsOutput,
    // types
    plugins: [
      typescript({
        tsconfig: /*
          options.tsconfig ?? */ resolve(__dirname, './tsconfig.bundle.json'),
        declaration: true,
        emitDeclarationOnly: true,
        skipLibCheck: true,
        paths: {},
      }),
    ],
    external,
  };

  /**
   * Bundle previously generated dist/types/index.d.ts
   */

  const typesDir = join(dirname(dtsOutput.file!), 'types');
  options.typesInput =
    options.typesInput ?? join(typesDir, subExportsPath, 'index.d.ts');

  const dtsBundleOptions: RollupOptions = {
    input: options.typesInput,
    // .d.ts bundle
    output: [
      {
        file: join(`dist`, subExportsPath, `index.d.ts`),
        format: 'es',
      },
    ],
    plugins: [
      dts(),
      del({
        targets: 'dist/types',
        hook: 'buildEnd',
      }),
    ],
    external,
  };

  // building the main bundle
  if (!subExportsPath) {
    bundleOptions.plugins.push(
      copy({
        targets: [{ src: packageJsonPath, dest: 'dist/' }],
      }),
    );
  }
  return rollupDefineConfig([bundleOptions, dtsOptions, dtsBundleOptions]);
};
