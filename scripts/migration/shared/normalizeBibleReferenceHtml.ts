import * as cheerio from 'cheerio';

export function normalizeBibleReferenceHtml(html: string): string {
  if (!html) return '';

  const $ = cheerio.load(html, null, false);

  // Remove legacy list-item wrappers, preserving their contents.
  $('li.nobreak').each((_, element) => {
    const $li = $(element);
    $li.replaceWith($li.contents());
  });

  // Normalize whitespace only in text nodes.
  // This avoids altering HTML attributes or markup.
  $('*')
    .addBack()
    .contents()
    .each((_, node) => {
      // Text nodes only.
      if (node.type !== 'text') return;

      node.data = node.data
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/ {2,}/g, ' ');
    });

  return ($.root().html() || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}
