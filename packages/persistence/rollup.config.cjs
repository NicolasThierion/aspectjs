/* eslint-disable */
const { createConfig } = require('../../rollup.config.cjs');

module.exports = createConfig(__dirname, {
  input: ['./index.ts', './typeorm/_index.ts'],
  external: ['node:async_hooks'],
});
