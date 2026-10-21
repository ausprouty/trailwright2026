// shared/extractListItems.ts

import type { CheerioAPI, Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { ListItem } from 'src/types/content/ListBlock';

import { normalizeInlineHtml } from './normalizeInlineHtml';

type ExtractedListItem = Exclude<ListItem, string> & {
  icon?: string;
};

export function extractListItems(
  $: CheerioAPI,
  $list: Cheerio<AnyNode>,
): ExtractedListItem[] {
  const items: ExtractedListItem[] = [];

  $list.children('li').each((_, li) => {
    const $li = $(li);
    const $clone = $li.clone();

    // Extract optional lesson icon.
    const rawIcon =
      $clone.find('img.bullet-icon').first().attr('src') || '';

    const icon = rawIcon
      ? lessonIconKeyFromSrc(rawIcon)
      : '';

    // Remove icons from text.
    $clone.find('img.bullet-icon').remove();

    // Nested lists become children.
    $clone.children('ul, ol').remove();

    // Remove legacy paragraph wrappers.
    $clone.children('p').each((_, p) => {
      const $p = $(p);
      $p.replaceWith($p.contents());
    });

    const text = normalizeInlineHtml($clone.html() || '');

    const item: ExtractedListItem = {
      text,
      ...(icon ? { icon } : {}),
    };

    // Recursively convert nested lists.
    const $nestedList = $li.children('ul, ol').first();

    if ($nestedList.length > 0) {
      item.children = {
        style: $nestedList.is('ol') ? 'ordered' : 'unordered',
        items: extractListItems($, $nestedList),
      };
    }

    if (!isIgnorableHtml(text) || item.children) {
      items.push(item);
    }
  });

  return items;
}

function lessonIconKeyFromSrc(src: string): string {
  const fileName = src.split('/').pop() || '';
  return fileName.replace(/\.png$/i, '');
}

function isIgnorableHtml(html: string): boolean {
  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim() === '';
}
