import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import * as fs from 'fs';
import { isArray, mergeWith } from 'lodash';
import path from 'path';
import { RollupOptions } from 'rollup';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import babelrc from '../.babelrc.json';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const visualizer = require('rollup-plugin-visualizer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const babel = require('rollup-plugin-babel');

interface PackageJson {
    module?: string;
    fesm2015?: string;
    unpkg?: string;
    main?: string;
    esm2015?: string;
    name: string;
}

interface Project {
    package: PackageJson;
    packagePath: string;
    inputFile: string;
}

type RollupOptionsCustomizerFn = (
    options?: RollupOptions,
    packageJson?: PackageJson,
    packagePath?: string,
) => RollupOptions | void;
/**
 * Helper class to build the rollup configuration for the given package.json
 */
export class RollupConfig {
    private _configs: {
        [packageName: string]: {
            main?: RollupOptions;
            esm2015?: RollupOptions;
            fesm2015?: RollupOptions;
            unpkg?: RollupOptions;
            all?: RollupOptions;
        };
    } = {};
    private projects: Project[];

    constructor(projects: [string, string][]) {
        this.projects = projects.map((c) => {
            const [packagePath, inputFile] = c;
            if (!fs.existsSync(packagePath)) {
                throw new Error(`Package file does not exist: ${packagePath}`);
            }
            if (!fs.existsSync(inputFile)) {
                throw new Error(`Input file does not exist: ${inputFile}`);
            }

            return {
                package: JSON.parse(fs.readFileSync(packagePath).toString()),
                packagePath,
                inputFile,
            };
        });
    }

    private _setConfig(
        customizer: RollupOptionsCustomizerFn,
        configName: 'main' | 'esm2015' | 'fesm2015' | 'unpkg' | 'all',
        configFn: (project: Project) => RollupOptions,
    ) {
        this.projects.forEach((project) => {
            const pkg = project.package;
            this._configs[pkg.name] = this._configs[pkg.name] ?? {};
            const baseConfig = this._configs[pkg.name][configName] ?? configFn(project);
            if (baseConfig) {
                if (customizer) {
                    this._configs[pkg.name][configName] = (customizer(baseConfig, pkg, pkg.name) ??
                        baseConfig) as RollupOptions;
                } else {
                    this._configs[pkg.name][configName] = baseConfig;
                }
            }
        });
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

    create() {
        this.withAll();
        return Object.values(this._configs).flatMap((pkg) => Object.values(pkg));
    }
}

function fesm2015(project: Project, override: RollupOptions = {}) {
    if (!project.package.fesm2015) {
        console.warn(`${project.package.name}: missing "fesm2015" output definition. Skipping fesm2015 build`);
        return;
    }
    const output = path.resolve(path.dirname(project.packagePath), project.package.fesm2015);

    return _baseEsm2015(project, output, override, false);
}

function esm2015(project: Project, override: RollupOptions = {}) {
    if (!project.package.esm2015) {
        console.warn(`${project.package.name}: missing "esm2015" output definition. Skipping esm2015 build`);
        return;
    }
    const output = path.resolve(path.dirname(project.packagePath), project.package.esm2015);

    return _baseEsm2015(project, output, override, true);
}

function main(project: Project, override: RollupOptions = {}) {
    if (!project.package.main) {
        console.warn(`${project.package.name}: missing "main" output definition. Skipping umd build`);
        return;
    }
    const output = path.resolve(path.dirname(project.packagePath), project.package.main);

    return _baseUmd(project, output, override);
}

function unpkg(project: Project, override: RollupOptions = {}) {
    if (!project.package.unpkg) {
        console.warn(`${project.package.name}: missing "unpkg" output definition. Skipping unpkg build`);
        return;
    }
    const output = path.resolve(path.dirname(project.packagePath), project.package.unpkg);

    return _baseUmd(
        project,
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
                        mangle: false,
                        module: false,
                    }),
                ],
            },
            override,
            customizer,
        ),
    );
}

function _baseConfig(project: Project, rollupOptions: RollupOptions): RollupOptions {
    const config: RollupOptions = {
        input: project.inputFile,
        external: ['@aspectjs/core', /@aspectjs\/.*/],
        plugins: [sourcemaps(), resolve(), commonjs()],
    };

    return mergeWith(config, rollupOptions, customizer);
}

function _baseEsm2015(project: Project, distFile: string, options: RollupOptions, preserveModules: boolean) {
    let file: string;
    let dir: string;
    if (preserveModules) {
        dir = path.dirname(distFile);
    } else {
        file = distFile;
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
        },
        _baseConfig(project, options),
        customizer,
    );
}

function _createGlobalUmdName(name: string) {
    return name.replace('@aspectjs/', 'aspectjs.').replace('-', '_').replace('/', '_').replace(/\?.*$/, '');
}

function _baseUmd(project: Project, distFile: string, options: RollupOptions): RollupOptions {
    const name = _createGlobalUmdName(project.package.name);
    return mergeWith(
        {},
        _baseConfig(project, options),
        {
            output: {
                // noConflict: true,
                externalLiveBindings: false,
                exports: 'named',
                file: distFile,
                name,

                format: 'umd',
                sourcemap: true,
                esModule: false,
                globals: {
                    '@aspectjs/core': 'aspectjs.core',
                    '@aspectjs/core/commons': 'aspectjs.core_commons',
                    '@aspectjs/core/annotations': 'aspectjs.core_annotations',
                    '@aspectjs/core/utils': 'aspectjs.core_utils',
                },
            },
            plugins: [
                babel({
                    extensions: ['.js'],
                    ...babelrc,
                }),
                visualizer({
                    template: 'treemap', // 'treemap', 'sunburst', 'treemap', 'circlepacking', 'network'
                    filename: `${path.dirname(distFile)}/stats/${path.basename(distFile)}.html`,
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
