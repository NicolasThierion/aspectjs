/* eslint-disable */
const { createConfig } = require('../../rollup.config.cjs');

module.exports = createConfig({
  rootDir: __dirname,
  output: {
    umd: false,
    commonJS: false,
    dts: false,
    esm2020: false,
    fesm2020: false,
  },
});
