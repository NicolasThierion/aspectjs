const { extendMarkdown } = require('./custom-md');

const getConfig = require('vuepress-bar');

const {nav, sidebar} = getConfig(`${__dirname}/../docs`);
sidebar.forEach(s => {
    s.children = s.children.map(c => `docs/${c}`);
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
    ],
    themeConfig: {
        nav, sidebar,
    },
    markdown: {
        extendMarkdown,
    }
};