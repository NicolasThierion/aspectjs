import MarkdownIt from 'markdown-it';
import { customQuoteBlocks } from './quote-blocks';
export function extendsMarkdown(md: MarkdownIt) {
  return md.use(
    customQuoteBlocks([
      'warning',
      'info',
      'error',
      'danger',
      'boom',
      'tip',
      'question',
      'success',
    ]),
  );
}
