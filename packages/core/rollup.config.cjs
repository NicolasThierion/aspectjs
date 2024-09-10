/* eslint-disable */
const { createConfig } = require('../../rollup.config.cjs');
module.exports = createConfig({
  rootDir: __dirname,
  output: {
    globals: false,
    commonJS: true,
    umd: false,
    esm2020: false,
    fesm2020: false,
    dts: true,
  },
});
