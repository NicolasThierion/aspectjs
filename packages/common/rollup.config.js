/* eslint-disable */
require('ts-node').register();
const pkg = require('./package.json');
const { createConfig } = require('../../rollup.config.ts');

module.exports = createConfig('core', pkg);
