const path = require('path');
process.env.TS_NODE_PROJECT = path.join(process.cwd(), 'tsconfig.spec.json');
console.log(`Using file ${process.env.TS_NODE_PROJECT}`);
require('reflect-metadata');
require('tsconfig-paths/register');
require('ts-node/register');
require('./packages/core/utils/src/utils').__setDebug(true);

// needed for memo
localStorage = require('localstorage-ponyfill').createLocalStorage();
indexedDB = require('fake-indexeddb');

// configure reporters
// eslint-disable-next-line @typescript-eslint/no-var-requires
const JasmineConsoleReporter = require('jasmine-console-reporter');
const reporter = new JasmineConsoleReporter({
    colors: 2, // (0|false)|(1|true)|2
    cleanStack: 1, // (0|false)|(1|true)|2|3
    verbosity: 4, // (0|false)|1|2|(3|true)|4|Object
    listStyle: 'indent', // "flat"|"indent"
    timeUnit: 'ms', // "ms"|"ns"|"s"
    timeThreshold: { ok: 500, warn: 1000, ouch: 3000 }, // Object|Number
    activity: false, // boolean or string ("dots"|"star"|"flip"|"bouncingBar"|...)
    emoji: true,
    beep: true,
});

jasmine.getEnv().addReporter(reporter);
