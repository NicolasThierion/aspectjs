import { nodeResolve } from '@rollup/plugin-node-resolve';
import { RollupOptions } from 'rollup';
import { RollupConfig } from '../../build/rollup-config';

const rollupOptions: RollupOptions[] = new RollupConfig([
    ['./package.json', './dist/public_api.js'],
    ['./support/observables/package.json', './dist/support/observables/public_api.js'],
])
    .withAll((config) => {
        for (let i = 0; i < config.plugins.length; ++i) {
            if (config.plugins[i].name === 'node-resolve') {
                config.plugins[i] = nodeResolve({
                    resolveOnly: [/^((?!rxjs\/?.*).)*$/], // all but rxjs
                });
            }
        }
        const output = [config.output].flat()[0];
        const globals = (output.globals = output.globals ?? {}) as any;
        globals.rxjs = 'rxjs';
        globals['rxjs/operators'] = 'rxjs.operators';

        globals['@aspectjs/memo'] = 'aspectjs.memo';
        return config;
    })
    .create();

export default rollupOptions;
