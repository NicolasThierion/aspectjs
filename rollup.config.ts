import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import del from 'rollup-plugin-delete';

import type { OutputOptions, RollupOptions } from 'rollup';
import { resolve, relative, join } from 'path';
import { cwd } from 'process';
// This file was created with the help of  https://github.com/VitorLuizC/typescript-library-boilerplate
interface PackageJson {
  name: string;
  version: string;
  author: string;
  license: string;
}

export const createConfig = (
  name: string,
  options: {
    pkg: PackageJson;
    tsconfig: string;

    input?: string;
    typesInput?: string;
  },
) => {
  options.input = options.input ?? './index.ts';

  options.typesInput =
    options.typesInput ??
    join(
      './dist/types/',
      relative(cwd(), options.input).replace(/\.ts$/, '.d.ts'),
    );

  const pkg = options.pkg;

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

    // createOutputOptions({
    //   file: `./dist/${name}.umd.min.js`,
    //   format: 'umd',
    //   plugins: [terser()],
    // }),
    // ],
    plugins: [
      typescript({
        // cacheDir: '.rollup.tscache',
        tsconfig:
          options.tsconfig ?? resolve(__dirname, './tsconfig.bundle.json'),
        // explicitly disable declarations, as a rollup config is dedicated for them
        declaration: false,
        declarationDir: undefined,
        declarationMap: undefined,
        module: 'esnext',
      }),
    ],
    external,
  };

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
        // paths: {},
      }),
    ],
    external,
  };

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
  console.debug();

  return [bundleOptions, dtsOptions, dtsBundleOptions];
};
