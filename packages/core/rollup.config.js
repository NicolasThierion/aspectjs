/* eslint-disable */
require('ts-node').register();
const { createConfig } = require('../../rollup.config.ts');

module.exports = createConfig('core', __dirname);
