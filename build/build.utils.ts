import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import * as fs from 'fs';
import { isArray, mergeWith } from 'lodash';
import path from 'path';
import { RollupOptions } from 'rollup';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import _typescript from 'rollup-plugin-typescript2';
import babelrc from '../.babelrc.json';

const visualizer = require('rollup-plugin-visualizer');
const babel = require('rollup-plugin-babel');

const typescript = _typescript as any;

interface PackageJson {
    module?: string;
    fesm2015?: string;
    unpkg?: string;
    main?: string;
    esm2015?: string;
    name: string;
}

type RollupOptionsCustomizerFn = (
    options?: RollupOptions,
    packageJson?: PackageJson,
    packagePath?: string,
) => RollupOptions | void;
/**
 * Helper class to build the rollup configuration for the given package.json
 */
export class RollupConfigUtils {
    static package(packagePath: string) {
        const pkg = JSON.parse(fs.readFileSync(packagePath).toString());
        return new (class {
            private _configs: {
                [packagePath: string]: {
                    main?: RollupOptions;
                    esm2015?: RollupOptions;
                    fesm2015?: RollupOptions;
                    unpkg?: RollupOptions;
                    all?: RollupOptions;
                };
            } = {};
            constructor() {}

            private _setConfig(
                customizer: RollupOptionsCustomizerFn,
                configName: 'main' | 'esm2015' | 'fesm2015' | 'unpkg' | 'all',
                configFn: (packagePath: string, pkg: object) => RollupOptions,
            ) {
                this._configs[packagePath] = this._configs[packagePath] ?? {};
                const baseConfig = this._configs[packagePath][configName] ?? configFn(packagePath, pkg);
                if (customizer) {
                    this._configs[packagePath][configName] = (customizer(baseConfig, pkg, packagePath) ??
                        baseConfig) as RollupOptions;
                } else {
                    this._configs[packagePath][configName] = baseConfig;
                }
            }
            withMain(customizer?: RollupOptionsCustomizerFn) {
                this._setConfig(customizer, 'main', main);
                return this;
            }

            withEsm2015(customizer?: RollupOptionsCustomizerFn) {
                this._setConfig(customizer, 'esm2015', esm2015);
                return this;
            }

            withFesm2015(customizer?: RollupOptionsCustomizerFn) {
                this._setConfig(customizer, 'fesm2015', fesm2015);
                return this;
            }

            withUnpkg(customizer?: RollupOptionsCustomizerFn) {
                this._setConfig(customizer, 'unpkg', unpkg);
                return this;
            }
            withAll(customizer?: RollupOptionsCustomizerFn) {
                this.withMain(customizer);
                this.withEsm2015(customizer);
                this.withFesm2015(customizer);
                this.withUnpkg(customizer);
                return this;
            }

            getRollupConfigs() {
                return Object.values(this._configs).flatMap((pkg) => Object.values(pkg));
            }
        })();
    }
}

function fesm2015(packagePath: string, pkg: PackageJson, override: RollupOptions = {}) {
    const output = pkg.module || pkg.fesm2015;
    if (!output) {
        console.warn(`${pkg.name}: missing "fesm2015" output definition. Skipping fesm2015 build`);
        return;
    }

    return _baseEsm2015(packagePath, pkg, output, override, false);
}

function esm2015(packagePath: string, pkg: PackageJson, override: RollupOptions = {}) {
    const output = pkg.esm2015;
    if (!output) {
        console.warn(`${pkg.name}: missing "esm2015" output definition. Skipping esm2015 build`);
        return;
    }

    return _baseEsm2015(packagePath, pkg, output, override, true);
}

function main(packagePath: string, pkg: PackageJson, override: RollupOptions = {}) {
    const output = pkg.main;
    if (!output) {
        console.warn(`${pkg.name}: missing "main" output definition. Skipping umd build`);
        return;
    }

    return _baseUmd(packagePath, pkg, output, override);
}

function unpkg(packagePath: string, pkg: PackageJson, override: RollupOptions = {}) {
    const output = pkg.unpkg;
    if (!output) {
        console.warn(`${pkg.name}: missing "unpkg" output definition. Skipping unpkg build`);
        return;
    }

    return _baseUmd(
        packagePath,
        pkg,
        output,
        mergeWith(
            {
                plugins: [
                    terser({
                        compress: true,
                        ecma: 5,
                        ie8: false,
                        keep_classnames: false,
                        keep_fnames: false,
                        mangle: {
                            eval: true,
                            keep_classnames: false,
                            keep_fnames: false,
                            properties: true,
                        },
                        module: false,
                    }),
                ],
            },
            override,
            customizer,
        ),
    );
}

function _baseConfig(
    packagePath: string,
    pkg: PackageJson,
    rollupOptions: RollupOptions,
    tsconfigOverride = {},
): RollupOptions {
    const config: RollupOptions = {
        input: path.resolve(path.dirname(packagePath), 'public_api.ts'),
        external: ['@aspectjs/core', /@aspectjs\/.*/],
        plugins: [
            sourcemaps(),
            resolve(),
            commonjs(),
            typescript({
                clean: true,
                tsconfigOverride: mergeWith(
                    {
                        compilerOptions: {
                            // rootDir: path.join(__dirname, '..'),
                            module: 'esnext',
                            sourceMap: true,
                            inlineSourceMap: false,
                            declaration: false,
                            declarationMap: false,
                            composite: false,
                        },
                    },
                    tsconfigOverride,
                    customizer,
                ),
            }),
        ],
    };

    return mergeWith(config, rollupOptions, customizer);
}

function _baseEsm2015(
    packagePath: string,
    pkg: PackageJson,
    distFile: string,
    options: RollupOptions,
    preserveModules: boolean,
) {
    let file: string;
    let dir: string;
    if (preserveModules) {
        dir = path.resolve(path.dirname(packagePath), path.dirname(distFile));
    } else {
        file = path.resolve(path.dirname(packagePath), distFile);
    }
    const output = [
        mergeWith(
            {
                sourcemap: true,
                format: 'esm',
                dir,
                file,
                chunkFileNames: '[name].js', // disable hash generation
                preserveModules,
            },
            options?.output ?? {},
            customizer,
        ),
    ];
    return mergeWith(
        {
            output,
        } as RollupOptions,
        _baseConfig(packagePath, pkg, options, {
            compilerOptions: {
                target: 'es2015',
            },
        }),
        customizer,
    );
}

function _createGlobalUmdName(name: string) {
    return name.replace('@aspectjs/', 'aspectjs.').replace('-', '_').replace('/', '_');
}

function _baseUmd(packagePath: string, pkg: PackageJson, distFile: string, options: RollupOptions) {
    const file = path.resolve(path.dirname(packagePath), distFile);
    const name = _createGlobalUmdName(pkg.name);
    return mergeWith(
        {},
        _baseConfig(packagePath, pkg, options),
        {
            output: {
                // noConflict: true,
                externalLiveBindings: false,
                exports: 'named',
                file,
                name,

                format: 'umd',
                sourcemap: true,
                esModule: false,
                globals: [
                    '@aspectjs/core',
                    '@aspectjs/core/types',
                    '@aspectjs/core/commons',
                    '@aspectjs/core/annotations',
                    '@aspectjs/core/utils',
                ].reduce((globals, name) => {
                    globals[name] = _createGlobalUmdName(name);
                    return globals;
                }, {} as Record<string, string>),
            },
            plugins: [
                babel({
                    extensions: ['.js', 'ts'],
                    ...babelrc,
                }),
                visualizer({
                    template: 'treemap', // 'treemap', 'sunburst', 'treemap', 'circlepacking', 'network'
                    filename: `${path.dirname(file)}/stats/${path.basename(file)}.html`,
                }),
            ],
        } as RollupOptions,
        customizer,
    );
}

function customizer(a: any, b: any) {
    if (isArray(b)) {
        if (isArray(a)) {
            return a.concat(b);
        }
        return b;
    }
}
