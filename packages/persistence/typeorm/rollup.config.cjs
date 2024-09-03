/* eslint-disable */
const { createConfig } = require('../../../rollup.config.cjs');
module.exports = createConfig({
  rootDir: __dirname,
  external: ['node:async_hooks'],
  output: {
    umd: false,
  },
});
