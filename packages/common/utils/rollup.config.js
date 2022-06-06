/* eslint-disable */

require('ts-node').register();
const { join } = require('path');
const pkg = require('./package.json');
const { createConfig } = require('../../../rollup.config.ts');

module.exports = createConfig('common-utils', {
  pkg,
  input: join(__dirname, 'index.ts'),
  tsconfig: join(__dirname, 'tsconfig.json'),
});
