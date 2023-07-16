// eslint-disable-next-line @typescript-eslint/no-var-requires
const commonjs = require('@rollup/plugin-commonjs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeResolve = require('@rollup/plugin-node-resolve');

/* eslint-disable */

const external = [];
const { createConfig } = require('../../rollup.config.cjs');
module.exports = createConfig({
  rootDir: __dirname,
  // external,
  output: {},
  plugins: [commonjs(), nodeResolve(external)],
});
