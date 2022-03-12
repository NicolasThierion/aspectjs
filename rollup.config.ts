import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import del from 'rollup-plugin-delete';

import type { OutputOptions, RollupOptions } from 'rollup';
import { resolve } from 'path';
interface PackageJson {
  name: string;
  version: string;
  author: string;
  license: string;
}

export const createConfig = (name: string, pkg: PackageJson) => {
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
    };
  }

  /**
   * @type {import('rollup').RollupOptions}
   */
  const bundleOptions: RollupOptions = {
    input: './src/index.ts',
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
      // UMD
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
        tsconfig: resolve(__dirname, './tsconfig.bundle.json'),
        // explicitely disable declarations, as a rollup config is dedicated for them
        declaration: false,
        declarationDir: undefined,
        declarationMap: undefined,
      }),
    ],
  };

  const dtsOptions: RollupOptions = {
    input: './src/index.ts',

    // .d.ts
    output: [
      {
        file: `./dist/${name}.mjs`,
        format: 'es',
        sourcemap: true,
      },
    ],
    // types
    plugins: [
      typescript({
        tsconfig: resolve(__dirname, './tsconfig.bundle.json'),
        declaration: true,
        emitDeclarationOnly: true,
      }),
    ],
  };

  const dtsBundleOptions: RollupOptions = {
    input: './dist/types/index.d.ts',
    // .d.ts bundle
    output: [{ file: `dist/${name}.d.ts`, format: 'es' }],
    plugins: [
      dts(),
      del({
        targets: 'dist/types',
        hook: 'buildEnd',
      }),
    ],
  };

  return [bundleOptions, dtsOptions, dtsBundleOptions];
};
