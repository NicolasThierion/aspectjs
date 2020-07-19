import MarkdownIt from 'markdown-it';
import { spoilers } from './spoilers';

const JSDOM = require('jsdom').JSDOM;
const path = require('path');

const customQuoteBlocks: MarkdownIt.PluginWithOptions = (md: MarkdownIt) => {
    function replaceImagePath(filePath: string) {
        return filePath.replace('12px', 'large');
    }

    const customBlockQuotes = {
        warning: 'custom-block warning',
        info: 'custom-block info',
        error: 'custom-block error',
        danger: 'custom-block danger',
        boom: 'custom-block boom',
        tip: 'custom-block tip',
        question: 'custom-block question',
    } as any;
    const origMd = new MarkdownIt();

    origMd.renderer.rules.blockquote_open = md.renderer.rules.blockquote_open;
    origMd.renderer.rules.image = md.renderer.rules.image;
    md.renderer.rules.image = function (tokens, index, options, env, self) {
        const img = JSDOM.fragment(`${origMd.renderer.render(tokens, options, env)}`).firstElementChild;

        if (customBlockQuotes[img.alt]) {
            const filename = path.basename(img.src);
            tokens[index].attrs.filter((a) => a[0] === 'src').forEach((a) => (a[1] = replaceImagePath(a[1])));
        }
        return self.renderToken(tokens, index, options);
    };

    md.renderer.rules.blockquote_open = function (tokens, index, options, env, self) {
        let inlineIndex = index + 1;
        while (tokens[inlineIndex].type !== 'inline' && tokens[inlineIndex].type !== 'blockquote_close') {
            inlineIndex++;
        }

        if (tokens[inlineIndex].type === 'inline') {
            const dom = new JSDOM();
            const el = JSDOM.fragment(`${origMd.renderer.render(tokens[inlineIndex].children, options, env)}`);

            let imgNode = el.firstElementChild;
            if (imgNode && imgNode.tagName.toUpperCase() === 'IMG') {
                if (customBlockQuotes[imgNode.alt]) {
                    tokens[index].tag = 'div';
                    let nesting = 1;
                    let closingTokenIndex = index;
                    let currentToken;
                    do {
                        currentToken = tokens[++closingTokenIndex];
                        nesting += currentToken.nesting;
                    } while (!(currentToken.type === 'blockquote_close' && nesting === 0));
                    tokens[closingTokenIndex].tag = 'div';

                    tokens[index].attrJoin('class', customBlockQuotes[imgNode.alt]);
                }
            }
        }

        return self.renderToken(tokens, index, options);
    };
};

module.exports = {
    extendMarkdown: (md: MarkdownIt) => {
        return md.use(spoilers).use(customQuoteBlocks);
    },
};
