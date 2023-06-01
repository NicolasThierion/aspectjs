import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { findUpSync } from 'find-up';
import { existsSync, readFileSync } from 'fs';
import json5 from 'json5';
import { dirname, join, relative, resolve } from 'path';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
const { parse } = json5;
import { defineConfig as rollupDefineConfig } from 'rollup';
export const createConfig = (optionsOrRootDir) => {
    const options = typeof optionsOrRootDir === 'string'
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
        .filter((tsconfig) => existsSync(tsconfig))[0];
    options.tsconfig =
        options.tsconfig ??
            (existsSync(localTsConfig)
                ? localTsConfig
                : resolve(__dirname, './tsconfig.json'));
    let exportName;
    if (!options.pkg) {
        const packageJsonPath = findUpSync('package.json', {
            cwd: options.rootDir,
        });
        exportName = dirname(relative(options.rootDir, packageJsonPath));
        parse(readFileSync(packageJsonPath).toString());
    }
    else {
        exportName = options.pkg.name;
    }
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
    const name = `${pkg.name.replace('@', '').split('/').splice(1).join('-')}`;
    /**
     * Creates an output options object for Rollup.js.
     * @param {import('rollup').OutputOptions} options
     * @returns {import('rollup').OutputOptions}
     */
    function createOutputOptions(options) {
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
                plugins: [terser.default()],
            }),
        ],
        plugins: [
            typescript.default({
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
    const dtsOutput = bundleOptions.output[0];
    const dtsOptions = {
        input: options.input,
        // .d.ts
        output: dtsOutput,
        // types
        plugins: [
            typescript.default({
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
    const typesDir = join(dirname(dtsOutput.file), 'types');
    options.typesInput =
        options.typesInput ?? join(typesDir, exportName, 'index.d.ts');
    const dtsBundleOptions = {
        input: options.typesInput,
        // .d.ts bundle
        output: [
            {
                file: [`dist`, exportName, `${name}.d.ts`]
                    .filter((p) => p !== undefined)
                    .join('/'),
                format: 'es',
            },
        ],
        plugins: [
            dts(),
            del.default({
                targets: 'dist/types',
                hook: 'buildEnd',
            }),
        ],
        external,
    };
    return rollupDefineConfig([bundleOptions, dtsOptions, dtsBundleOptions]);
};