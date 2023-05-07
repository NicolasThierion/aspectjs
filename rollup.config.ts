import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { existsSync, readFileSync } from 'fs';
import json5 from 'json5';
import { join, relative, resolve } from 'path';
import { cwd } from 'process';
import type { OutputOptions, RollupOptions } from 'rollup';
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
  name: string,
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

  options.typesInput =
    options.typesInput ??
    join(
      './dist/types/',
      relative(cwd(), options.input).replace(/\.ts$/, '.d.ts'),
    );

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

  options.pkg =
    options.pkg ??
    parse(readFileSync(join(join(options.rootDir, 'package.json'))).toString());
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
      name: `${pkg.name.replace('@', '').replace('/', '-')}`,
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
  const bundleOptions: RollupOptions = {
    input: options.input,
    output: [
      // CommonJS
      createOutputOptions({
        file: `./dist/${name}.cjs`,
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
  };

  /**
   * Generate only types into dist/types/index.d.ts
   */
  const dtsOptions: RollupOptions = {
    input: options.input,

    // .d.ts
    output: [
      createOutputOptions({
        file: `./dist/${name}.cjs`,
        format: 'cjs',
        sourcemap: true,
      }),
    ],
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
  const dtsBundleOptions: RollupOptions = {
    input: options.typesInput,
    // .d.ts bundle
    output: [{ file: `dist/${name}.d.ts`, format: 'es' }],
    plugins: [
      dts(),
      del({
        targets: 'dist/types',
        hook: 'buildEnd',
      }),
    ],
    external,
  };
  return rollupDefineConfig([bundleOptions, dtsOptions, dtsBundleOptions]);
};
