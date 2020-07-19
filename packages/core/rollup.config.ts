import { RollupOptions } from 'rollup';
import { RollupConfigUtils } from '../build/build.utils';

const rollupOptions: RollupOptions[] = RollupConfigUtils.scanPackages('package.json').createRollupConfigs({
    input: 'core.ts',
}).all;

export default rollupOptions;
