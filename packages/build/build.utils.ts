import path from 'path';
import { terser } from 'rollup-plugin-terser';
import { isArray, mergeWith } from 'lodash';
import babelrc from '../../.babelrc.json';
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import globby from 'globby';

const visualizer = require('rollup-plugin-visualizer');
const babel = require('rollup-plugin-babel');

import { RollupOptions } from 'rollup';
import * as fs from 'fs';

interface PackageJson {
    module?: string;
    fesm2015?: string;
    unpkg?: string;
    main?: string;
    esm2015?: string;
    name: string;
}

/**
 * Helper class to build the rollup configuration for the given package.json
 */
export class RollupConfigUtils {
    static scanPackages(...packageJson: string[]) {
        const pkgs = globby.sync(packageJson).reduce((pkgs, pkg) => {
            pkgs[pkg] = JSON.parse(fs.readFileSync(pkg).toString());
            return pkgs;
        }, {} as Record<string, PackageJson>);

        return {
            createRollupConfigs(overrides?: RollupOptions) {
                const configs = Object.entries(pkgs).reduce(
                    (configs, e) => {
                        const [packagePath, pkg] = e;
                        configs.main.push(main(packagePath, pkg, overrides));
                        configs.esm2015.push(esm2015(packagePath, pkg, overrides));
                        configs.fesm2015.push(fesm2015(packagePath, pkg, overrides));
                        configs.unpkg.push(unpkg(packagePath, pkg, overrides));
                        return configs;
                    },
                    {
                        main: [] as RollupOptions[],
                        esm2015: [] as RollupOptions[],
                        fesm2015: [] as RollupOptions[],
                        unpkg: [] as RollupOptions[],
                        all: [] as RollupOptions[],
                    },
                );

                configs.all.push(...Object.values(configs).flat());
                return configs;
            },
        };
    }
}

function fesm2015(packagePath: string, pkg: PackageJson, override: RollupOptions = {}) {
    const output = pkg.module || pkg.fesm2015;
    if (!output) {
        console.warn(`${pkg.name}: missing "fesm2015" output definition. Skipping fesm2015 build`);
        return;
    }

    return mergeWith(
        _baseConfig(packagePath, pkg, {
            compilerOptions: {
                target: 'es2015',
            },
        }),
        _baseEsm2015(packagePath, pkg, path.dirname(output)),
        {
            preserveModules: false,
        },
        override,
        customizer,
    );
}

function esm2015(packagePath: string, pkg: PackageJson, override: RollupOptions = {}) {
    const output = pkg.esm2015;
    if (!output) {
        console.warn(`${pkg.name}: missing "esm2015" output definition. Skipping esm2015 build`);
        return;
    }

    return mergeWith(
        _baseConfig(packagePath, pkg, {
            compilerOptions: {
                target: 'es2015',
            },
        }),
        _baseEsm2015(packagePath, pkg, path.dirname(output)),
        {
            preserveModules: true,
        },
        override,
        customizer,
    );
}

function main(packagePath: string, pkg: PackageJson, override: RollupOptions = {}) {
    const output = pkg.main;
    if (!output) {
        console.warn(`${pkg.name}: missing "main" output definition. Skipping umd build`);
        return;
    }

    const config = _baseUmd(packagePath, pkg, output);

    return mergeWith({}, _baseConfig(packagePath, pkg), config, override, customizer);
}

function unpkg(packagePath: string, pkg: PackageJson, override: RollupOptions = {}) {
    const output = pkg.unpkg;
    if (!output) {
        console.warn(`${pkg.name}: missing "unpkg" output definition. Skipping unpkg build`);
        return;
    }

    const config = _baseUmd(packagePath, pkg, output);

    return mergeWith(
        {},
        _baseConfig(packagePath, pkg),
        config,
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
    );
}

function _baseConfig(packagePath: string, pkg: PackageJson, tsconfigOverride = {}) {
    const config = {
        input: path.resolve(path.dirname(packagePath), 'public_api.ts'),
        plugins: [
            sourcemaps(),
            typescript({
                clean: true,
                tsconfigOverride: mergeWith(
                    {
                        compilerOptions: {
                            module: 'esnext',
                            sourceMap: true,
                            inlineSourceMap: false,
                            declaration: false,
                            composite: false,
                        },
                    },
                    tsconfigOverride,
                    customizer,
                ),
            }),
            resolve(),
            commonjs(),
        ],
    };

    return mergeWith(config, customizer);
}

function _baseEsm2015(packagePath: string, pkg: PackageJson, dist: string) {
    return {
        output: [
            {
                sourcemap: true,
                format: 'esm',
                dir: path.resolve(path.dirname(packagePath), dist),
                chunkFileNames: '[name].js', // disable hash generation
            },
        ],
    };
}

function _baseUmd(packagePath: string, pkg: PackageJson, distFile: string) {
    distFile = path.resolve(path.dirname(packagePath), distFile);

    const name = pkg.name.replace('/', '.').replace(/^@/, '');
    return {
        output: {
            file: distFile,
            name,
            format: 'umd',
            sourcemap: true,
            esModule: false,
            globals: {
                '@aspectjs/core': 'aspectjs.core',
            },
        },
        plugins: [
            babel({
                extensions: ['.js', '.ts'],
                ...babelrc,
            }),
            visualizer({
                template: 'treemap', // 'treemap', 'sunburst', 'treemap', 'circlepacking', 'network'
                filename: `${path.dirname(distFile)}/stats.html`,
            }),
        ],
    };
}

function customizer(a: any, b: any) {
    if (isArray(b)) {
        if (isArray(a)) {
            return a.concat(b);
        }
        return b;
    }
}
