import typescript from 'rollup-plugin-typescript2';
import { join } from 'path';
import visualizer from 'rollup-plugin-visualizer';
import cleaner from 'rollup-plugin-cleaner';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import { mergeWith, isArray } from 'lodash';
import babelrc from './.babelrc.json';

const dist = 'dist';

export function configFactory(pkg) {
    const baseConfig = {
        input: 'public_api.ts',
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

    const esmConfig = {
        plugins: [
            cleaner({
                targets: [dist],
            }),
            visualizer({
                template: 'treemap', // 'treemap', 'sunburst', 'treemap', 'circlepacking', 'network'
                filename: `${dist}/stats.html`,
            }),
        ],
        output: [
            {
                file: pkg.module,
                format: 'esm',
            },
        ],
    };

    const umdConfig = {
        plugins: [
            babel({
                extensions: ['.js', '.ts'],
                ...babelrc,
            }),
        ],
        output: [
            {
                file: pkg.main,
                name: pkg.name,
                format: 'umd',
                plugins: [],
            },
            {
                file: pkg.unpgk,
                name: pkg.name,
                format: 'umd',
                plugins: [terser()],
            },
        ],
    };

    return [mergeWith({}, baseConfig, esmConfig, customizer), mergeWith({}, baseConfig, umdConfig, customizer)];
}

function customizer(a, b) {
    if (isArray(a) && isArray(b)) {
        return a.concat(b);
    }
    return undefined;
}
