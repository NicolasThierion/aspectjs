/* eslint-disable */

require('ts-node').register({
  compilerOptions: {
    module: 'CommonJS',
    rootDir: '.',
  },

  // and other tsconfig.json options as you like
});

const { createConfig } = require('./rollup.config.ts');

module.exports = {
  createConfig,
};
