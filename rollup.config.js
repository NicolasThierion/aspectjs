import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import { join } from 'path';
import visualizer from 'rollup-plugin-visualizer';
import cleaner from 'rollup-plugin-cleaner';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import { mergeWith, isArray } from 'lodash';

const name = 'aspectjs-core';
const dist = 'dist';

const baseConfig = {
    input: 'index.ts',
    plugins: [
        typescript({
            objectHashIgnoreUnknownHack: true,
            clean: true,
            tsconfigOverride: {
                compilerOptions: {
                    module: 'esnext',
                },
            },
        }),
    ],
};

export const esmConfig = {
    plugins: [
        cleaner({
            targets: [dist],
        }),
        copy({
            targets: [{ src: 'package.json', dest: dist }],
        }),
        visualizer({
            template: 'treemap', // 'treemap', 'sunburst', 'treemap', 'circlepacking', 'network'
            filename: 'dist/stats.html',
        }),
    ],
    output: [
        {
            file: join(dist, pkg.module),
            format: 'esm',
        },
    ],
};

export const umdConfig = {
    plugins: [
        babel({
            extensions: ['.js', '.ts'],
        }),
    ],
    output: [
        {
            file: join(dist, pkg.main),
            name,
            format: 'umd',
            plugins: [],
        },
        {
            file: join(dist, pkg.unpgk),
            name,
            format: 'umd',
            plugins: [terser()],
        },
    ],
};

export default [
    mergeWith({}, baseConfig, esmConfig, customizer),
    mergeWith({}, baseConfig, umdConfig, customizer),
];

function customizer(a, b) {
    if (isArray(a) && isArray(b)) {
        return a.concat(b);
    }
    return undefined;
}
