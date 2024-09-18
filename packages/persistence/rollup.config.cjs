/* eslint-disable */
const { createConfig } = require('../../rollup.config.cjs');

module.exports = createConfig({
  rootDir: __dirname,
  tsconfig: './tsconfig.lib.json',
  output: {
    commonJS: false,
    esm2020: false,

    umd: false,
    fesm2020: false,
  },
});
