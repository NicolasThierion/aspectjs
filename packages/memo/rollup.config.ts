import { RollupOptions } from 'rollup';
import { RollupConfigUtils } from '../build/build.utils';

const rollupOptions: RollupOptions[] = RollupConfigUtils.scanPackages('package.json').createRollupConfigs({
    external: ['@aspectjs/core'],
    input: ['memo.ts'],
}).all;

export default rollupOptions;
