import typescript from 'rollup-plugin-typescript2';

import visualizer from 'rollup-plugin-visualizer';
import cleaner from 'rollup-plugin-cleaner';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import { isArray, mergeWith } from 'lodash';
import babelrc from './.babelrc.json';
import sourcemaps from 'rollup-plugin-sourcemaps';

const dist = 'dist';

export function configFactory(pkg) {
    const baseConfig = {
        input: 'public_api.ts',
        plugins: [
            sourcemaps(),
            typescript({
                clean: true,
                tsconfigOverride: {
                    compilerOptions: {
                        module: 'esnext',
                        sourceMap: true,
                        inlineSourceMap: false,
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
                sourcemap: true,
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
                sourcemap: true,
            },
            {
                file: pkg.unpgk,
                name: pkg.name,
                format: 'umd',
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
                sourcemap: true,
            },
        ],
    };

    return [mergeWith({}, baseConfig, esmConfig, customizer), mergeWith({}, baseConfig, umdConfig, customizer)];
}

function customizer(a, b) {
    if (isArray(a) && isArray(b)) {
        return a.concat(b);
    }
}
