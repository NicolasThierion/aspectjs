import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import visualizer from 'rollup-plugin-visualizer';
import cleaner from 'rollup-plugin-cleaner';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import { mergeWith, isArray } from 'lodash';

const name = 'aspectjs-core';
const baseConfig = {
    input: 'index.ts',
    plugins: [
        typescript({
            objectHashIgnoreUnknownHack: true,
            clean: true,
        }),
        visualizer({
            template: 'circlepacking', // 'sunburst', 'treemap', 'circlepacking', 'network'
            filename: 'dist/stats.html',
        }),
    ],
};

export const esmConfig = {
    plugins: [
        cleaner({
            targets: ['dist'],
        }),
        copy({
            targets: [{ src: 'package.json', dest: 'dist' }],
        }),
    ],
    output: [
        {
            file: pkg.module,
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
            file: pkg.main,
            name,
            format: 'umd',
            plugins: [],
        },
        {
            file: pkg.unpgk,
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
