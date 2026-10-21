import * as cheerio from 'cheerio';
import { ElementType } from 'domelementtype';
import { looksLikeBibleReference } from './looksLikeBibleReference';
import { normalizeInlineHtml } from './normalizeInlineHtml';

export function cleanBibleHtml(rawHtml: string): string {
  const $ = cheerio.load(`<div id="root">${rawHtml}</div>`);
  const $root = $('#root');

  // 1. Remove HTML comments, including nested comments.
  $root
    .contents()
    .add($root.find('*').contents())
    .filter((_, node) => node.type === ElementType.Comment)
    .remove();

  // 2. Remove unwanted Bible navigation and reference elements.
  $root.find('hr').remove();
  $root.find('a.bible-readmore, a.readmore').remove();
  $root.find('p.reference, p.myfriends-reference').remove();

  // 3. Remove Bible reference if it appears as the first paragraph.
  const $firstParagraph = $root.children('p').first();

  if ($firstParagraph.length) {
    const reference = $firstParagraph.text().trim();

    if (looksLikeBibleReference(reference)) {
      $firstParagraph.remove();
    }
  }

  // 4. Normalize legacy Bible section headings.
  $root.find('h4.bible').each((_, el) => {
    const $heading = $(el);

    $heading.replaceWith(`<h3>${$heading.html() || ''}</h3>`);
  });

  // 5. Normalize verse numbers.
  $root.find('sup.versenum, sup.versenum-rtl').each((_, el) => {
    const $sup = $(el);

    $sup.removeAttr('class');

    // Handles malformed numbers such as "۳ ۰" -> "۳۰".
    $sup.text($sup.text().replace(/\s+/g, ''));
  });

  // 6. Unwrap redundant Bible containers.
  // Preserve containers with additional classes.
  $root.find('div.bible').each((_, el) => {
    const $div = $(el);

    const classes = ($div.attr('class') || '')
      .split(/\s+/)
      .filter(Boolean);

    if (classes.length === 1 && classes[0] === 'bible') {
      $div.replaceWith($div.contents());
    }
  });

  // 7. Remove presentation-only paragraph classes.
  $root.find('p.bible, p.rtl').each((_, el) => {
    $(el).removeAttr('class');
  });

  // 8. Remove empty paragraphs, including whitespace and BR-only paragraphs.
  // Preserve paragraphs containing images or other meaningful elements.
  $root.find('p').each((_, el) => {
    const $p = $(el);

    const hasText =
      $p.text().replace(/\u00a0/g, ' ').trim().length > 0;

    const hasMeaningfulElement =
      $p.find('img, svg, video, audio, iframe').length > 0;

    if (!hasText && !hasMeaningfulElement) {
      $p.remove();
    }
  });

  // 9. Remove trailing BR elements inside paragraphs and other elements.
  $root.find('br').each((_, el) => {
    const $br = $(el);

    // Remove if no following sibling, including text nodes.
    if (!$br.next().length && !$br[0]?.nextSibling) {
      $br.remove();
    }
  });

  // 10. Remove trailing BR elements directly inside root.
  while ($root.children().last().is('br')) {
    $root.children().last().remove();
  }

  // 11. Apply existing shared inline HTML normalization.
  return normalizeInlineHtml($root.html() || '');
}


