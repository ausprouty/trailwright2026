import * as cheerio from 'cheerio';
import { unwrapRedundantSpans } from './unwrapRedundantSpans';
import { trimNbspEdges } from './trimNbspEdges';

export function normalizeInlineHtml(html: string): string {
  if (!html) {
    return '';
  }

  const $ = cheerio.load(`<div id="root">${html}</div>`);
  const $root = $('#root');

  // Remove legacy spans with no useful formatting.
  $root.find('span.unknown').each((_, el) => {
    const $el = $(el);
    $el.replaceWith($el.contents());
  });

  // Remove redundant spans while preserving meaningful formatting.
  unwrapRedundantSpans($, $root);

  // Remove redundant black text styling.
  $root.find('*').each((_, el) => {
    const $el = $(el);
    const style = $el.attr('style') || '';

    if (/^\s*color\s*:\s*black\s*;?\s*$/i.test(style)) {
      $el.removeAttr('style');
    }
  });

  $root
    .find('div')
    .toArray()
    .reverse()
    .forEach((element) => {
      const $div = $(element);

      const hasContent =
        $div
          .text()
          .replace(/\u00A0/g, ' ')
          .trim().length > 0 || $div.find('img, svg, video, iframe, br, hr').length > 0;

      if (!hasContent) {
        $div.remove();
      }
    });

  let cleaned = $root.html() || '';

  cleaned = cleaned
    .replace(/\r?\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s{2,}/g, ' ');

  return trimNbspEdges(cleaned).trim();
}
