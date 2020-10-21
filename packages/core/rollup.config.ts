import { RollupOptions } from 'rollup';
// @ts-ignore
import { RollupConfigUtils } from '../../build/build.utils';

const rollupOptions: RollupOptions[] = RollupConfigUtils.package('package.json')
    .withAll((options) => {
        options.external = ['@aspectjs/core/utils'];
        [options.output].flat()[0].globals = {
            '@aspectjs/core/utils': 'aspectjs.core.utils',
        };
    })
    .getRollupConfigs();

export default rollupOptions;
