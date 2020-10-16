require('ts-node/register');
const { extendMarkdown } = require('./custom-md');

const getConfig = require('vuepress-bar');

const { nav, sidebar } = getConfig(`${__dirname}/../docs`);

function prependPath(o) {
    if (typeof o === 'string') {
        return `docs/${o}`;
    } else {
        o.children = o.children.map(prependPath);
        return o;
    }
}
sidebar.forEach((s) => {
    s.children = s.children.map(prependPath);
    return s;
});
module.exports = {
    title: '@AspectJS',
    description: 'The AOP framework for javascript',
    // cache: false,
    plugins: [
        'vuepress-plugin-element-tabs',
        'reading-progress',
        'vuepress-bar',
        '@vuepress/active-header-links',
        '@vuepress/back-to-top',
        'vuepress-plugin-code-copy',
        '@vuepress/last-updated',
    ],

    themeConfig: {
        nav,
        sidebar,
        lastUpdated: 'Last Updated', // string | boolean
    },
    markdown: {
        extendMarkdown,
    },
    patterns: ['docs/**/*.md', '*.md', '!node_modules/**'],
};
