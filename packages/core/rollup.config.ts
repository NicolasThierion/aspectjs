import { RollupOptions } from 'rollup';
import pkg from './package.json';

// @ts-ignore
import { RollupConfigUtils } from '../../build/build.utils';

const rollupOptions: RollupOptions[] = RollupConfigUtils.package('package.json').withAll().getRollupConfigs();

export default rollupOptions;
