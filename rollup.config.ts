import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { existsSync, readFileSync } from 'fs';
import json5 from 'json5';
import { dirname, join, relative, resolve } from 'path';
import type { OutputOptions, Plugin, RollupOptions } from 'rollup';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import findUp from 'find-up';
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
  output?: {
    globals?: Record<string, string>;
  };
  plugins?: Plugin[];
  typesInput?: string;
  external?: string[];
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

  const packageJsonPath = join(options.rootDir, 'package.json');

  const subExportsPath = relative(process.cwd(), dirname(packageJsonPath));

  options.pkg = options.pkg ?? parse(readFileSync(packageJsonPath).toString());

  const baseName =
    subExportsPath || options.pkg!.name.split('/').splice(-1)[0]!;

  const name = options
    .pkg!.name.replace(/^@/, '')
    .split('/')
    .concat(subExportsPath)
    .filter((p) => !!p)
    .join('.');
  const pkg = options.pkg!;
  const external = [
    ...(options.external ?? []),
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
   * @param {import('rollup').OutputOptions} outputOptions
   * @returns {import('rollup').OutputOptions}
   */
  function createOutputOptions(
    outputOptions: Partial<OutputOptions>,
  ): OutputOptions {
    return {
      banner,
      name,
      exports: 'named',
      sourcemap: true,
      ...outputOptions,
      globals: {
        ...(options.output?.globals ?? {}),
        '@aspectjs/common': 'aspectjs.common',
        '@aspectjs/common/testing': 'aspectjs.common.testing',
        '@aspectjs/common/utils': 'aspectjs.common.utils',
        '@aspectjs/core': 'aspectjs.core',
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
        file: `./dist/cjs/${baseName}.cjs`,
        format: 'cjs',
      }),
      // ES 2020
      createOutputOptions({
        dir: join(`./dist/esm2020/`, subExportsPath),
        format: 'esm',
        preserveModules: true,
      }),
      // FESM2020
      createOutputOptions({
        file: `./dist/fesm2020/${baseName}.mjs`,
        format: 'esm',
        preserveModules: false,
      }),
      // UMD
      createOutputOptions({
        file: `./dist/umd/${baseName}.umd.js`,
        format: 'umd',
      }),
      // UMD min
      createOutputOptions({
        file: `./dist/umd/${baseName}.umd.min.js`,
        format: 'umd',
        plugins: [terser()],
      }),
    ],

    plugins: [
      ...(options.plugins ?? []),

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
      ...(options.plugins ?? []),

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
      ...(options.plugins ?? []),

      dts(),
      del({
        targets: 'dist/types',
        hook: 'buildEnd',
      }),
    ],
    external,
  };

  // building the main bundle
  // if (!subExportsPath) {
  const readme = findUp.sync('README.md') ?? 'README.md';
  const assetsDir = findUp.sync('.assets') ?? '.assets';
  bundleOptions.plugins.push(
    copy({
      targets: [
        { src: packageJsonPath, dest: `dist/${subExportsPath}` },
        { src: assetsDir, dest: `dist/.assets` },
        {
          src: join(subExportsPath, readme),
          dest: `dist/${subExportsPath}`,
          caseSensitiveMatch: false,
        },
      ],
    }),
  );

  return rollupDefineConfig([bundleOptions, dtsOptions, dtsBundleOptions]);
};
