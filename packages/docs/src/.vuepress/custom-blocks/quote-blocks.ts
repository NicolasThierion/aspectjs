import MarkdownIt from 'markdown-it';
import { JSDOM } from 'jsdom';

export function customQuoteBlocks(
  blockNames: string[]
): MarkdownIt.PluginWithOptions {
  return (md: MarkdownIt) => {
    const customBlockQuotes: any = blockNames.reduce((acc, cssClass) => {
      return {
        ...acc,
        [cssClass]: `custom-block ${cssClass}`,
      };
    }, {});
    const origMd = new MarkdownIt();

    origMd.renderer.rules.blockquote_open = md.renderer.rules.blockquote_open;

    md.renderer.rules.blockquote_open = function (
      tokens,
      index,
      options,
      env,
      self
    ) {
      let inlineIndex = index + 1;
      while (
        tokens[inlineIndex].type !== 'inline' &&
        tokens[inlineIndex].type !== 'blockquote_close'
      ) {
        inlineIndex++;
      }

      if (tokens[inlineIndex].type === 'inline') {
        const el = JSDOM.fragment(
          `${origMd.renderer.render(
            tokens[inlineIndex].children!,
            options,
            env
          )}`
        );

        const stereotypeNode = el.firstElementChild as HTMLElement;
        if (stereotypeNode?.tagName.toUpperCase() === 'STRONG') {
          if (customBlockQuotes[stereotypeNode.innerHTML]) {
            el.removeChild(stereotypeNode);
            tokens[index].attrJoin(
              'class',
              customBlockQuotes[stereotypeNode.innerHTML]
            );
          }
        }
      }

      return self.renderToken(tokens, index, options);
    };
  };
}
