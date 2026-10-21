import type * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export function unwrapRedundantSpans(
  $: cheerio.CheerioAPI,
  $root: cheerio.Cheerio<AnyNode>,
): void {
  $root.find('span').each((_, el) => {
    const attrs = el.attribs || {};
    const names = Object.keys(attrs);

    const isRedundant =
      names.length === 0 ||
      (names.length === 1 &&
        names[0] === 'style' &&
        /^\s*color\s*:\s*black\s*;?\s*$/i.test(attrs.style || ''));

    if (isRedundant) {
      $(el).replaceWith($(el).contents());
    }
  });
}
