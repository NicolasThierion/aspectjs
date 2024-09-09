/* eslint-disable */
const { createConfig } = require('../../../rollup.config.cjs');
module.exports = createConfig({
  rootDir: __dirname,
  external: ['@nestjs/common'],
  output: {
    globals: {},
    umd: false,
  },
});
