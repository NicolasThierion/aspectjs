/* eslint-disable */

const { createConfig } = require('../../rollup.config.cjs');
module.exports = createConfig({
  output: {
    commonJS: true,
    dts: true,
    esm2020: true,
    fesm2020: true,
    umd: true,
  },
  rootDir: __dirname,
});
