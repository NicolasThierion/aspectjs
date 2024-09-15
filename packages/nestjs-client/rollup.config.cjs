/* eslint-disable */

const external = ['@aspectjs/nestjs/common', 'httyped-client'];
const { createConfig } = require('../../rollup.config.cjs');
module.exports = createConfig({
  external,
  output: {
    globals: {
      '@aspectjs/nestjs/common': 'aspectjs.nestjs.common',
      'httyped-client': 'httypedClient',
    },
  },
  rootDir: __dirname,
});
