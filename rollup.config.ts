import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import findUp from 'find-up';
import { existsSync, readFileSync } from 'fs';
import json5 from 'json5';
import { dirname, join, relative, resolve } from 'path';
import type { OutputOptions, Plugin, RollupOptions } from 'rollup';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import tmp from 'tmp';
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
    commonJS?: boolean;
    umd?: boolean;
    esm2020?: boolean;
    fesm2020?: boolean;
    dts?: boolean;
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
    .join('.')
    .replaceAll(/-(\w)/g, (_m, g) => g.toUpperCase());

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

  const definedOptions: RollupOptions[] = [];
  /**
   * @type {import('rollup').RollupOptions}
   */
  const bundleOptions = {
    input: options.input,
    output: [] as OutputOptions[],
    plugins: [
      // sourcemaps(),
      ...(options.plugins ?? []),
      typescript({
        // cacheDir: '.rollup.tscache',
        tsconfig: options.tsconfig,
        // explicitly disable declarations, as a rollup config is dedicated for them
        declaration: false,
        declarationDir: undefined,
        declarationMap: undefined,
        sourceMap: true,
        inlineSources: true,
        module: 'esnext',
      }),
    ],
    external,
  } satisfies RollupOptions;

  if (options.output?.commonJS ?? true) {
    // CommonJS
    bundleOptions.output.push(
      createOutputOptions({
        file: `./dist/cjs/${baseName}.cjs`,
        format: 'cjs',
        preserveModules: false,
      }),
    );
  }

  if (options.output?.esm2020 ?? true) {
    bundleOptions.output.push(
      // ES 2020
      createOutputOptions({
        dir: join(`./dist/esm2020/`, subExportsPath),
        format: 'esm',
        preserveModules: true,
      }),
    );
  }
  if (options.output?.fesm2020 ?? true) {
    bundleOptions.output.push(
      // FESM2020
      createOutputOptions({
        file: `./dist/fesm2020/${baseName}.mjs`,
        format: 'esm',
        preserveModules: false,
      }),
    );
  }

  if (options.output?.umd ?? true) {
    bundleOptions.output.push(
      // UMD
      createOutputOptions({
        file: `./dist/umd/${baseName}.umd.js`,
        format: 'umd',
        preserveModules: false,
      }),
      // UMD min
      createOutputOptions({
        file: `./dist/umd/${baseName}.umd.min.js`,
        format: 'umd',
        plugins: [terser()],
        preserveModules: false,
      }),
    );
  }

  if (bundleOptions.output.length) {
    definedOptions.push(bundleOptions);
  }

  /**
   * Generate only types into dist/types/index.d.ts
   */
  if (options.output?.dts ?? true) {
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

    definedOptions.push(dtsOptions, dtsBundleOptions);
  }

  // building the main bundle
  if (!subExportsPath) {
    const readme =
      findUp.sync('README.md') ??
      findUp.sync('readme.md') ??
      findUp.sync('Readme.md') ??
      'README.md';
    const assetsDir =
      findUp.sync('.assets', {
        type: 'directory',
      }) ?? '.assets';

    tmp.setGracefulCleanup();
    // rollup throw an error if no input, so give a dummy one
    const dumyInput = tmp.fileSync({
      name: 'DUMMY_INPUT_ASSETS_GOAL',
    }).name;
    definedOptions.push({
      input: dumyInput,
      onwarn: (warning, defaultHandler) => {
        if (
          warning.code === 'EMPTY_BUNDLE' &&
          warning.names![0] === 'DUMMY_INPUT_ASSETS_GOAL'
        ) {
          return;
        }

        defaultHandler(warning);
      },
      plugins: copy({
        targets: [
          { src: packageJsonPath, dest: `dist/` },
          { src: assetsDir, dest: `dist/` },
          {
            src: readme,
            dest: `dist/${subExportsPath}`,
            caseSensitiveMatch: false,
          },
        ],
      }),
    });
  }

  return rollupDefineConfig(definedOptions);
};
