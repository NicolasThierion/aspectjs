/* eslint-disable */
const { createConfig } = require('../../../rollup.config.cjs');
module.exports = createConfig({
  rootDir: __dirname,
  external: ['@nestjs/common'],
  tsconfig: './tsconfig.lib.json',
  output: {
    globals: {},
    umd: false,
  },
});
