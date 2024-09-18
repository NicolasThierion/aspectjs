/* eslint-disable */

const { createConfig } = require('../../rollup.config.cjs');
module.exports = createConfig({
  rootDir: __dirname,
  tsconfig: './tsconfig.lib.json',
});
