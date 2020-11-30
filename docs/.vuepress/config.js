const path = require('path');
process.env.TS_NODE_PROJECT = path.join(__dirname, 'tsconfig.json');
require('ts-node/register');
const { extendMarkdown } = require('./custom-md');

const getConfig = require('vuepress-bar');

const { nav, sidebar } = getConfig(`${__dirname}/..`, {
    maxLevel: 4,
});

module.exports = {
    title: '@AspectJS',
    description: 'The AOP framework for Javascript and Typescript',
    // cache: false,
    plugins: [
        'reading-progress',
        'vuepress-bar',
        '@vuepress/active-header-links',
        '@vuepress/back-to-top',
        'vuepress-plugin-code-copy',
        '@vuepress/last-updated',
    ],

    themeConfig: {
        logo: '/aspectjs.png',
        nav,
        sidebar,
        lastUpdated: 'Last Updated', // string | boolean
    },
    markdown: {
        extendMarkdown,
    },
    base: '/aspectjs/',
    patterns: ['**/*.md'],
    head: [],
};
