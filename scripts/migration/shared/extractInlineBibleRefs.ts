// scripts/migration/shared/extractInlineBibleRefs.ts

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export type BibleRef = {
  id: string;
  reference: string;
  html: string;
  instructionKey?: string;
};

export type InlineBibleRefResult = {
  html: string;
  bibleRefs: BibleRef[];
};

type ExtractInlineBibleRefsOptions = {
  normalizeInlineHtml: (html: string) => string;
  normalizeTextForEditor: (text: string) => string;
};

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function extractInlineBibleRefs(
  $: cheerio.CheerioAPI,
  $container: cheerio.Cheerio<AnyNode>,
  options: ExtractInlineBibleRefsOptions,
): InlineBibleRefResult {
  const $clone = $container.clone();
  const bibleRefs: BibleRef[] = [];

  $clone.find('a[href^="javascript:popUp"]').each((_, link) => {
    const $link = $(link);
    const href = $link.attr('href') || '';
    const match = href.match(/popUp\(['"]([^'"]+)['"]\)/);

    if (!match) {
      return;
    }

    const id = match[1];
    if (!id) {
      return;
    }
    const reference = options.normalizeTextForEditor($link.text());

    if (!reference) {
      return;
    }

    const $popup = $clone.find(`div.popup#${id}`).first();
    const popupHtml = options.normalizeInlineHtml($popup.html() || '');

    bibleRefs.push({
      id,
      reference,
      html: popupHtml,
      instructionKey: 'bibleRef.readForMore',
    });

    $link.replaceWith(
      `<span class="bible-ref" data-ref-id="${escapeAttribute(id)}">${reference}</span>`,
    );

    $popup.remove();
  });

  $clone.find('div.popup').remove();

  return {
    html: options.normalizeInlineHtml($clone.html() || ''),
    bibleRefs,
  };
}