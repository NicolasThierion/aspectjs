import { RollupOptions } from 'rollup';
// @ts-ignore
import { RollupConfigUtils } from '../../../build/build.utils';
const rollupUtilsOptions: RollupOptions[] = RollupConfigUtils.package('package.json')
    .withAll()
    .withFesm2015()
    .getRollupConfigs();

export default rollupUtilsOptions;
