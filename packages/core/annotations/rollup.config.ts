import { RollupOptions } from 'rollup';
import { RollupConfigUtils } from '../../../build/build.utils';
const rollupUtilsOptions: RollupOptions[] = RollupConfigUtils.package('package.json')
    .withAll()
    .withFesm2015()
    .getRollupConfigs();

export default rollupUtilsOptions;
