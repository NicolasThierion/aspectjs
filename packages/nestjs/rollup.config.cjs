/* eslint-disable */
const { createConfig } = require('../../rollup.config.cjs');
const external = ['@nestjs/common'];
module.exports = createConfig(__dirname, {
  external,
});
