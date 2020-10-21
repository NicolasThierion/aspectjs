import { RollupOptions } from 'rollup';
// @ts-ignore
import { RollupConfigUtils } from '../../build/build.utils';

const rollupOptions: RollupOptions[] = RollupConfigUtils.package('package.json').withAll().getRollupConfigs();

export default rollupOptions;
