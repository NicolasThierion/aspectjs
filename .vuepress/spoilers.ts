import MarkdownIt from 'markdown-it';
const mdContainer = require('markdown-it-container');

export const spoilers: MarkdownIt.PluginWithOptions = (md: MarkdownIt) => {
    // https://www.npmjs.com/package/markdown-it-container
    md.use(mdContainer, 'spoiler', {
        validate: function (params: any) {
            return params.trim().match(/^spoiler$/);
        },

        render: function (tokens: any[], idx: number) {
            var m = tokens[idx].info.trim().match(/^spoiler$/);

            if (tokens[idx].nesting === 1) {
                return `<div class="spoiler">
  <div class="spoiler-btn spoiler-btn-top"><a>${md.utils.escapeHtml(m[1])}</a> </div>
  <div class="spoiler-body">\n`;
            } else {
                // closing tag
                return '</div></div>\n';
            }
        },
    });
};
