// eslint-disable-next-line @typescript-eslint/no-var-requires
const commonjs = require('@rollup/plugin-commonjs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeResolve = require('@rollup/plugin-node-resolve');

/* eslint-disable */

const external = ['@emotion/hash', 'json-stable-stringify', 'uid'];
const { createConfig } = require('../../rollup.config.cjs');
module.exports = createConfig({
  rootDir: __dirname,
  // external,
  output: {
    globals: {
      '@emotion/hash': 'hash',
      'json-stable-stringify': 'json-stable-stringify',
      uid: 'uid',
    },
  },
  plugins: [commonjs(), nodeResolve(external)],
});
