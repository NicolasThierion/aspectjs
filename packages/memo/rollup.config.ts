import { nodeResolve } from '@rollup/plugin-node-resolve';
import { RollupOptions } from 'rollup';
import { RollupConfigUtils } from '../../build/build.utils';

const rollupOptions: RollupOptions[] = RollupConfigUtils.package('package.json')
    .withAll((config) => {
        for (let i = 0; i < config.plugins.length; ++i) {
            if (config.plugins[i].name === 'node-resolve') {
                config.plugins[i] = nodeResolve({
                    resolveOnly: [/^((?!rxjs\/?.*).)*$/], // all but rxjs
                });
            }
        }
        const output = [config.output].flat()[0];
        const globals = (output.globals = output.globals ?? ({} as any));
        globals.rxjs = 'rxjs';
        globals['rxjs/operators'] = 'rxjs.operators';

        return config;
    })
    .getRollupConfigs();

export default rollupOptions;
