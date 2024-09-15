/* eslint-disable */
const { createConfig } = require('../../rollup.config.cjs');

module.exports = createConfig({
  rootDir: __dirname,
  output: {
    umd: false,
  },
});
