/* eslint-disable */

require('ts-node').register({
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
    allowImportingTsExtensions: true,
    rootDir: '.',
  },

  // and other tsconfig.json options as you like
});

const { createConfig } = require('./rollup.config.ts');

module.exports = {
  createConfig,
};
