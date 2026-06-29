// basics/migrateOldLessonHtml

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { isTag, isText } from 'domhandler';

import { ElementType } from 'domelementtype';
import type { SectionMarkerBlockData } from 'src/types/content/MigrationTypes';
import { remapImagePaths } from '../remapImagePaths';
import type { EditorJsContent, SectionTheme, VideoSource } from 'src/types/content/MigrationTypes';
import type { AnyEditorJsBlock } from 'src/types/content/EditorBlocks';
import { extractPopupBibleReferences } from '../shared/extractPopupBibleReferences';

import { extractInlineBibleRefs, type BibleRef } from '../shared/extractInlineBibleRefs';

type MigrateOptions = {
  includeTime?: boolean;
  includeVersion?: boolean;
};

function buildBiblePassageBlock(reference: string, html: string, url: string): AnyEditorJsBlock {
  return {
    type: 'biblePassage',
    data: {
      reference,
      html,
      url,
      isOpen: false,
    },
  };
}

export function buildCollapsibleGroupBlock(
  title: string,
  contentBlocks: AnyEditorJsBlock[],
): AnyEditorJsBlock {
  return {
    type: 'collapsibleGroup',
    data: {
      title,
      isOpen: false,
      content: {
        blocks: contentBlocks,
        version: '2.31.5',
      },
    },
  };
}

function buildHeaderBlock(
  text: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 3,
  image?: string,
): AnyEditorJsBlock {
  return {
    type: 'header',
    data: {
      text,
      level,
      ...(image ? { image } : {}),
    },
  };
}

function buildListBlock(style: 'ordered' | 'unordered', items: string[]): AnyEditorJsBlock {
  return {
    type: 'list',
    data: {
      style,
      items,
    },
  };
}
function buildListOrBibleReferenceBlock(
  $: cheerio.CheerioAPI,
  $list: cheerio.Cheerio<AnyNode>,
): AnyEditorJsBlock | null {
  if (elementHasPopupReferences($list)) {
    const popupResult = extractPopupBibleReferences($, $list);

    if (popupResult.hasReferences) {
      return {
        type: 'bibleReference',
        data: {
          text: popupResult.html,
          references: popupResult.references,
          isOpen: false,
        },
      };
    }
  }

  const items = extractListItems($, $list);

  if (items.length === 0) {
    return null;
  }

  return buildListBlock(isOrderedList($list) ? 'ordered' : 'unordered', items);
}

function buildNotesAreaBlock(storageKey: string): AnyEditorJsBlock {
  return {
    type: 'notesArea',
    data: {
      notes: '',
      storageKey,
    },
  };
}

function buildParagraphBlock(html: string, bibleRefs: BibleRef[] = []): AnyEditorJsBlock {
  return {
    type: 'paragraph',
    data: {
      text: html,
      ...(bibleRefs.length > 0 ? { bibleRefs } : {}),
    },
  };
}

function buildSectionMarkerBlock(
  theme: SectionTheme,
  title?: string,
  icon?: string,
): Extract<AnyEditorJsBlock, { type: 'sectionMarker' }> {
  const data: SectionMarkerBlockData = {
    theme,
  };
  if (title) {
    data.title = title;
  }
  if (icon) {
    data.icon = icon;
  }
  return {
    type: 'sectionMarker',
    data,
  };
}

function buildVideoBlock(
  title: string,
  url: string,
  startTime: string,
  endTime: string,
): AnyEditorJsBlock {
  return {
    type: 'video',
    data: {
      title,
      url,
      source: detectVideoSource(url),
      refId: parseArclightRefId(url),
      startTime,
      endTime,
      isOpen: false,
      isEditing: false,
    },
  };
}

function cleanBibleHtml(rawHtml: string): string {
  const $ = cheerio.load(`<div id="root">${rawHtml}</div>`);
  const $root = $('#root');

  $root.find('hr').remove();

  $root.find('a.bible-readmore, a.readmore').remove();
  $root.find('p.reference, p.myfriends-reference').remove();

  const $firstParagraph = $root.children('p').first();
  const firstParagraphText = $firstParagraph.text().trim();

  if (looksLikeBibleReference(firstParagraphText)) {
    $firstParagraph.remove();
  }

  $root.find('br').each((_, el) => {
    const $el = $(el);
    const next = $el.next();

    if (!next.length) {
      $el.remove();
    }
  });

  return normalizeInlineHtml($root.html() || '');
}
function cleanPopupPassageHtml($: cheerio.CheerioAPI, rawHtml: string): string {
  const $root = $('<div></div>').html(rawHtml);

  // Remove migration/source comments.
  $root
    .contents()
    .filter((_, node) => node.type === ElementType.Comment)
    .remove();

  // Repeatedly unwrap pointless single-child div wrappers.
  let html = $root.html() || '';

  for (let i = 0; i < 5; i += 1) {
    const $tmp = $('<div></div>').html(html.trim());
    const children = $tmp.children();

    if (
      children.length === 1 &&
      children.first().is('div') &&
      $tmp
        .contents()
        .filter((_, node) => node.type === ElementType.Text && $(node).text().trim().length > 0)
        .length === 0
    ) {
      html = children.first().html() || '';
    } else {
      break;
    }
  }

  return html.trim();
}

function collapsePlainTextWhitespace(text: string): string {
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}
function collectPopupMap($: cheerio.CheerioAPI): Map<string, string> {
  const popupMap = new Map<string, string>();

  $('.popup[id]').each((_, el) => {
    const $popup = $(el);
    const id = $popup.attr('id');

    if (!id) return;

    const rawHtml = $popup.html() || '';
    const passage = cleanPopupPassageHtml($, rawHtml);

    popupMap.set(id, passage);

    // Remove so it does not become a visible paragraph later.
    $popup.remove();
  });

  return popupMap;
}
function convertPopupLinksToBibleReferenceBlock(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<AnyNode>,
  popupMap: Map<string, string>,
): AnyEditorJsBlock {
  const references: Array<{
    id: string;
    marker: string;
    label: string;
    passage: string;
  }> = [];

  $el.find('a[href*="popUp"]').each((_, link) => {
    const $link = $(link);
    const href = $link.attr('href') || '';
    const popupId = getPopUpIdFromHref(href);

    if (!popupId) return;
    console.log('popupId:', popupId);
    console.log('popupMap keys:', Array.from(popupMap.keys()));
    console.log('passage:', popupMap.get(popupId));

    const label = $link.text().trim();
    const marker = label;
    const passage = popupMap.get(popupId) || '';

    references.push({
      id: `popup_${popupId}`,
      marker,
      label,
      passage,
    });

    $link.replaceWith(`{${marker}}`);
  });

  return {
    type: 'bibleReference',
    data: {
      text: $el.html()?.trim() || '',
      references,
      isOpen: false,
    },
  };
}

function decodeHtmlEntities(text: string): string {
  const $ = cheerio.load(`<div id="decode-root">${text}</div>`);
  return $('#decode-root').text();
}

function detectVideoSource(url: string): VideoSource {
  if (/arclight\.org/i.test(url)) {
    return 'arclight';
  }

  if (/youtube\.com|youtu\.be/i.test(url)) {
    return 'youtube';
  }

  if (/vimeo\.com/i.test(url)) {
    return 'vimeo';
  }

  return '';
}
function elementHasPopupReferences($element: cheerio.Cheerio<AnyNode>): boolean {
  return (
    $element.find('a[href^="javascript:popUp("]').length > 0 || $element.find('.popup').length > 0
  );
}

function extractBibleReference($container: cheerio.Cheerio<AnyNode>): string {
  const explicitReference = $container
    .find('p.reference, p.myfriends-reference')
    .first()
    .text()
    .trim();

  if (explicitReference) {
    return explicitReference;
  }

  const $firstParagraph = $container.children('p').first();
  const firstParagraphText = $firstParagraph.text().trim();

  if (looksLikeBibleReference(firstParagraphText)) {
    return firstParagraphText;
  }

  return '';
}

function extractBibleUrl($container: cheerio.Cheerio<AnyNode>): string {
  const href = $container.find('a.bible-readmore, a.readmore').first().attr('href');

  return typeof href === 'string' ? href.trim() : '';
}
function extractLessonListItems(
  $: cheerio.CheerioAPI,
  $list: cheerio.Cheerio<AnyNode>,
): { text: string; icon?: string }[] {
  const items: { text: string; icon?: string }[] = [];

  $list.children('li').each((_, li) => {
    const $li = $(li);

    const rawIcon = $li.find('img.bullet-icon').first().attr('src') || '';
    const icon = lessonIconKeyFromSrc(rawIcon);

    // remove icon so it does not pollute text
    $li.find('img.bullet-icon').remove();

    const text = normalizeInlineHtml($li.html() || $li.text() || '');

    if (!isIgnorableHtml(text)) {
      items.push({
        text,
        ...(icon ? { icon } : {}),
      });
    }
  });

  return items;
}

function extractListItems($: cheerio.CheerioAPI, $list: cheerio.Cheerio<AnyNode>): string[] {
  return $list
    .children('li')
    .map((_, li) => normalizeInlineHtml($(li).html() || ''))
    .get()
    .filter(Boolean);
}

function extractRevealContentBlocks(
  $: cheerio.CheerioAPI,
  $container: cheerio.Cheerio<AnyNode>,
  popupMap: Map<string, string>,
): AnyEditorJsBlock[] {
  const nestedBlocks: AnyEditorJsBlock[] = [];

  function pushElement($element: cheerio.Cheerio<AnyNode>): void {
    if ($element.is('hr')) {
      return;
    }

    if ($element.hasClass('popup')) {
      return;
    }
    if (isNoteArea($element)) {
      const rawKey =
        $element.attr('id')?.trim() || $element.find('form').first().attr('id')?.trim() || 'note';

      const storageKey = rawKey === 'note#' ? `note-${nestedBlocks.length + 1}` : rawKey;

      nestedBlocks.push(buildNotesAreaBlock(storageKey));
      return;
    }
    if (isFilmReveal($element)) {
      const title = extractVideoField($element, /^Title:/i);
      const url = extractVideoField($element, /^URL:/i);
      const startTime = extractVideoField($element, /^Start Time/i);
      const endTime = extractVideoField($element, /^End Time/i);

      const videoBlock = buildVideoBlock(title, url, startTime, endTime);

      if (videoBlock) {
        nestedBlocks.push(videoBlock);
      }

      return;
    }

    if ($element.find('a[href*="popUp"]').length > 0 || $element.is('a[href*="popUp"]')) {
      nestedBlocks.push(convertPopupLinksToBibleReferenceBlock($, $element, popupMap));
      return;
    }

    if ($element.is('h2')) {
      const text = normalizeTextForEditor($element.text());

      if (text) {
        nestedBlocks.push(buildHeaderBlock(text, 2));
      }

      return;
    }

    if ($element.is('h3')) {
      const text = normalizeTextForEditor($element.text());

      if (text) {
        nestedBlocks.push(buildHeaderBlock(text, 3));
      }

      return;
    }
    if (isOrderedList($element) || isUnorderedList($element)) {
      const block = buildListOrBibleReferenceBlock($, $element);

      if (block) {
        nestedBlocks.push(block);
      }

      return;
    }

    if ($element.is('div.background-text')) {
      const popupResult = extractPopupBibleReferences($, $element);

      if (popupResult.hasReferences) {
        nestedBlocks.push({
          type: 'bibleReference',
          data: {
            text: popupResult.html,
            references: popupResult.references,
            isOpen: false,
          },
        });

        return;
      }

      const rawText = normalizeTextForEditor($element.clone().children().remove().end().text());

      if (rawText) {
        nestedBlocks.push(buildParagraphBlock(rawText));
      }

      $element.contents().each((_, inner) => {
        if (!isTag(inner)) {
          return;
        }

        pushElement($(inner));
      });

      return;
    }

    if ($element.is('div.lesson')) {
      const rawText = normalizeTextForEditor($element.clone().children().remove().end().text());

      if (rawText) {
        nestedBlocks.push(buildParagraphBlock(rawText));
      }

      $element.contents().each((_, inner) => {
        if (!isTag(inner)) {
          return;
        }

        pushElement($(inner));
      });

      return;
    }

    const result = extractInlineBibleRefs($, $element, {
      normalizeInlineHtml,
      normalizeTextForEditor,
    });

    if (!isIgnorableHtml(result.html)) {
      nestedBlocks.push(buildParagraphBlock(result.html, result.bibleRefs));
    }
  }

  $container.contents().each((_, child) => {
    if (!isTag(child)) {
      return;
    }

    pushElement($(child));
  });

  return nestedBlocks;
}

function extractVideoField($container: cheerio.Cheerio<AnyNode>, labelPattern: RegExp): string {
  let value = '';

  $container.find('tr').each((_, row) => {
    const $row = $container.find(row);
    const $cells = $row.children('td');

    if ($cells.length < 2) {
      return;
    }

    const label = normalizeVideoLabel($cells.eq(0).text());
    const cellValue = $cells.eq(1).text().replace(/\s+/g, ' ').trim();

    if (labelPattern.test(label)) {
      value = cellValue;
    }
  });

  return value;
}

function getNextCollapsedDiv(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<AnyNode>,
): cheerio.Cheerio<AnyNode> {
  const id = $el.attr('id') || '';
  const match = id.match(/^Summary(.+)$/);

  if (match) {
    const byId = $(`#Text${match[1]}`);

    if (byId.length > 0) {
      return byId.first();
    }
  }

  return $el.nextAll('div.collapsed').first();
}

function getPopUpIdFromHref(href: string): string | undefined {
  const match = href.match(/popUp\(['"]([^'"]+)['"]\)/i);
  return match?.[1];
}

function getSectionIconKey($el: cheerio.Cheerio<AnyNode>): string | undefined {
  const imageSrc = ($el.find('img.lesson-icon').first().attr('src') || '').toLowerCase();

  if (
    imageSrc.includes('arrowleft') ||
    imageSrc.includes('arrow-left') ||
    imageSrc.includes('arrow_left')
  ) {
    return 'arrow-left';
  }

  if (
    imageSrc.includes('arrowright') ||
    imageSrc.includes('arrow-right') ||
    imageSrc.includes('arrow_right')
  ) {
    return 'arrow-right';
  }

  if (
    imageSrc.includes('arrowup') ||
    imageSrc.includes('arrow-up') ||
    imageSrc.includes('arrow_up')
  ) {
    return 'arrow-up';
  }

  if (imageSrc.includes('background')) {
    return 'background';
  }

  if (imageSrc.includes('bible-study')) {
    return 'bible-study';
  }

  if (imageSrc.includes('challenges')) {
    return 'challenges';
  }

  if (imageSrc.includes('discover')) {
    return 'discover';
  }

  if (imageSrc.includes('review')) {
    return 'review';
  }

  if (imageSrc.includes('sharing-life')) {
    return 'sharing-life';
  }
  return undefined;
}

function getSectionTheme($el: cheerio.Cheerio<AnyNode>): SectionTheme {
  const imageSrc = ($el.find('img.lesson-icon').first().attr('src') || '').toLowerCase();

  const subtitleText = getSectionTitle($el).trim().toUpperCase();

  if (imageSrc.includes('sharing-life')) {
    return 'sharing-life' as SectionTheme;
  }

  if (imageSrc.includes('review')) {
    return 'review';
  }

  if (imageSrc.includes('bible-study')) {
    return 'bible-study';
  }

  if (imageSrc.includes('discover')) {
    return 'discover' as SectionTheme;
  }

  if (imageSrc.includes('challenges')) {
    return 'challenge';
  }

  if (imageSrc.includes('background')) {
    return 'background' as SectionTheme;
  }

  if (
    imageSrc.includes('arrowleft') ||
    $el.find(
      '.lesson-section.back, .lesson-subtitle.back, .lesson-section .back, .lesson-subtitle .back',
    ).length > 0 ||
    subtitleText === 'ZUSAMMENKOMMEN'
  ) {
    return 'back';
  }

  if (
    imageSrc.includes('arrowup') ||
    $el.find('.lesson-section.up, .lesson-subtitle.up, .lesson-section .up, .lesson-subtitle .up')
      .length > 0 ||
    subtitleText === 'ENTDECKEN' ||
    subtitleText === 'BIBELSTUDIUM' ||
    subtitleText === 'KOMMENTAR ZUM BIBELTEXT'
  ) {
    return 'up';
  }

  if (
    imageSrc.includes('arrowright') ||
    $el.find(
      '.lesson-section.forward, .lesson-subtitle.forward, .lesson-section .forward, .lesson-subtitle .forward',
    ).length > 0 ||
    subtitleText === 'WEITERGEBEN' ||
    subtitleText === 'SPEZIFISCHE FRAGEN UND PRAXIS'
  ) {
    return 'forward';
  }

  if (subtitleText === 'WIEDERHOLEN') {
    return 'review';
  }

  console.warn('Unknown lesson section theme:', {
    imageSrc,
    subtitleText,
  });

  return 'up';
}
function getSectionTitle($el: cheerio.Cheerio<AnyNode>): string {
  const title = $el.find('.lesson-subtitle, .lesson-section').first().text();

  return normalizeTextForEditor(title);
}
function isBackgroundNoteWrapper($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('#background_note');
}
function isBibleContainer($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.hasClass('bible_container') || $el.hasClass('bible') || $el.is('#bible');
}
function isBibleReveal($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.reveal.bible');
}

function isCollapsedDiv($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.collapsed');
}

function isCollapsibleBibleButton($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('button.collapsible.bible');
}

function isCollapsibleSummary($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.summary');
}

function isEmptyLessonDiv($el: cheerio.Cheerio<AnyNode>): boolean {
  const text = normalizeTextForEditor($el.text());

  return $el.is('div.lesson') && text === '';
}

function isFilmReveal($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.reveal.film');
}

function isGospelPointLesson($el: cheerio.Cheerio<AnyNode>): boolean {
  const imageSrc = ($el.find('img.lesson-icon').first().attr('src') || '').toLowerCase();

  return imageSrc.includes('/images/gospel/');
}

function isHeadingThree($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('h3');
}

function isHeadingTwo($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('h2');
}

function isIgnorableHtml(html: string): boolean {
  const textOnly = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return textOnly === '';
}

function isLessonDiv($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.lesson');
}

function isNoteArea($el: cheerio.Cheerio<AnyNode>): boolean {
  return (
    $el.is('div.note-area, div.note-div') ||
    $el.hasClass('note-area') ||
    $el.hasClass('note-div') ||
    $el.find('textarea').length > 0
  );
}

function isOrderedList($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('ol');
}

function isOrderedListWrapper($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.ol');
}

function isParagraph($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('p');
}

function isPlainReveal($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.reveal') && !isBibleReveal($el) && !isFilmReveal($el);
}

function isSectionMarkerLesson($el: cheerio.Cheerio<AnyNode>): boolean {
  if (!$el.hasClass('lesson')) {
    return false;
  }

  const hasIcon = $el.children('img.lesson-icon').length > 0;

  const hasTitle =
    $el.children('.lesson-section').length > 0 || $el.children('.lesson-subtitle').length > 0;

  return hasIcon && hasTitle;
}

function isUnorderedList($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('ul');
}

function lessonIconKeyFromSrc(src: string): string {
  const fileName = src.split('/').pop() || '';

  return fileName.replace(/\.png$/i, '');
}

function looksLikeBibleReference(text: string): boolean {
  return /^[1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+(?::\d+(?:-\d+)?)?$/.test(text.trim());
}

function normalizeInlineHtml(html: string): string {
  if (!html) {
    return '';
  }
  const $ = cheerio.load(`<div id="root">${html}</div>`);
  const $root = $('#root');

  unwrapRedundantSpans($, $root);

  $root.find('*').each((_, el) => {
    const $el = $(el);
    const style = $el.attr('style') || '';

    if (/^\s*color\s*:\s*black\s*;?\s*$/i.test(style)) {
      $el.removeAttr('style');
    }
  });

  let cleaned = $root.html() || '';

  cleaned = cleaned
    .replace(/\r?\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><');

  return trimNbspEdges(cleaned).trim();
}

function normalizeTextForEditor(text: string): string {
  if (!text) {
    return '';
  }

  return collapsePlainTextWhitespace(decodeHtmlEntities(trimNbspEdges(text)));
}

function normalizeVideoLabel(label: string): string {
  return label.replace(/\s+/g, ' ').replace(/\s+:/g, ':').trim().toLowerCase();
}

function parseArclightRefId(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('refId') || '';
  } catch {
    return '';
  }
}
function repairMojibakeText(value: string): string {
  const repaired = repairUtf8AsWindows1252(value);

  return repaired
    .replaceAll('â–¶', '▶')
    .replaceAll('â–', '▶')
    .replaceAll('â€™', '’')
    .replaceAll('â€œ', '“')
    .replaceAll('â€', '”')
    .replaceAll('â€“', '–')
    .replaceAll('â€”', '—')
    .replaceAll('Â ', ' ')
    .replaceAll('â€­', '')
    .replaceAll('â€¬', '')
    .replaceAll('\u202D', '')
    .replaceAll('\u202C', '');
}

function repairUtf8AsWindows1252(value: string): string {
  if (!looksLikeMojibake(value)) {
    return value;
  }

  const bytes: number[] = [];

  for (const char of value) {
    const codePoint = char.codePointAt(0);

    if (codePoint === undefined) {
      continue;
    }

    const byte = windows1252CodePointToByte(codePoint);

    if (byte === null) {
      // Do not guess. If we hit a character we cannot reverse safely,
      // leave the original text unchanged.
      return value;
    }

    bytes.push(byte);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return value;
  }
}

function looksLikeMojibake(value: string): boolean {
  return /(?:æ|ä|è|é|å|ç|ã|ï|Â|â)/.test(value);
}

function windows1252CodePointToByte(codePoint: number): number | null {
  // ASCII
  if (codePoint >= 0x00 && codePoint <= 0x7f) {
    return codePoint;
  }

  // Important: preserve actual C1 control bytes.
  // Your Chinese mojibake includes these.
  if (codePoint >= 0x80 && codePoint <= 0x9f) {
    return codePoint;
  }

  // Latin-1 range
  if (codePoint >= 0xa0 && codePoint <= 0xff) {
    return codePoint;
  }

  const map: Record<number, number> = {
    0x20ac: 0x80, // €
    0x201a: 0x82, // ‚
    0x0192: 0x83, // ƒ
    0x201e: 0x84, // „
    0x2026: 0x85, // …
    0x2020: 0x86, // †
    0x2021: 0x87, // ‡
    0x02c6: 0x88, // ˆ
    0x2030: 0x89, // ‰
    0x0160: 0x8a, // Š
    0x2039: 0x8b, // ‹
    0x0152: 0x8c, // Œ
    0x017d: 0x8e, // Ž
    0x2018: 0x91, // ‘
    0x2019: 0x92, // ’
    0x201c: 0x93, // “
    0x201d: 0x94, // ”
    0x2022: 0x95, // •
    0x2013: 0x96, // –
    0x2014: 0x97, // —
    0x02dc: 0x98, // ˜
    0x2122: 0x99, // ™
    0x0161: 0x9a, // š
    0x203a: 0x9b, // ›
    0x0153: 0x9c, // œ
    0x017e: 0x9e, // ž
    0x0178: 0x9f, // Ÿ
  };

  return map[codePoint] ?? null;
}

function trimNbspEdges(text: string): string {
  return text.replace(/^(?:\s|&nbsp;|\u00A0)+/gi, '').replace(/(?:\s|&nbsp;|\u00A0)+$/gi, '');
}

function unwrapRedundantSpans($: cheerio.CheerioAPI, $root: cheerio.Cheerio<AnyNode>): void {
  let changed = true;

  while (changed) {
    changed = false;

    $root.find('span').each((_, el) => {
      const $el = $(el);
      const attrs = el.attribs || {};
      const attrNames = Object.keys(attrs);

      const hasOnlyColorBlack =
        attrNames.length === 1 &&
        attrNames[0] === 'style' &&
        /^\s*color\s*:\s*black\s*;?\s*$/i.test(attrs.style || '');

      const hasNoUsefulAttrs = attrNames.length === 0 || hasOnlyColorBlack;

      if (!hasNoUsefulAttrs) {
        return;
      }

      $el.replaceWith($el.html() || '');
      changed = true;
    });
  }
}

export function migrateOldLessonHtmlToEditorJs(
  html: string,
  options: MigrateOptions = {},
): EditorJsContent {
  const remappedHtml = remapImagePaths(html);
  const repairedHtml = repairMojibakeText(remappedHtml);
  const $ = cheerio.load(repairedHtml);
  const popupMap = collectPopupMap($);

  const blocks: AnyEditorJsBlock[] = [];
  let sectionIndex = 0;

  function processNode($el: cheerio.Cheerio<AnyNode>): void {
    const node = $el[0];

    console.log(
      'PROCESS NODE:',
      node?.type,
      node && isTag(node) ? node.name : undefined,
      $el.attr?.('class'),
      $el.html()?.slice(0, 120),
    );
    // 1. Ignore / cleanup cases firstif (!$el.length) return;
    if (isEmptyLessonDiv($el)) {
      return;
    }
    if (isCollapsedDiv($el)) {
      return;
    }
    // 2. Highest-priority wrappers / structural blocks
    if (isPlainReveal($el)) {
      const $clone = $el.clone();
      const $heading = $clone
        .children('h1, h2, h3, h4, h5, h6, p')
        .filter((_, el) => !isIgnorableHtml($(el).html() || $(el).text()))
        .first();
      const title = normalizeTextForEditor($heading.text());

      if ($heading.length > 0) {
        $heading.remove();
      }

      const nestedBlocks = extractRevealContentBlocks($, $clone, popupMap);

      if (title) {
        if (nestedBlocks.length > 0) {
          blocks.push(buildCollapsibleGroupBlock(title, nestedBlocks));
        } else {
          const fallbackHtml = normalizeInlineHtml($clone.html() || '');

          if (!isIgnorableHtml(fallbackHtml)) {
            blocks.push(buildCollapsibleGroupBlock(title, [buildParagraphBlock(fallbackHtml)]));
          }
        }

        return;
      }
    }
    if (isBibleReveal($el)) {
      const reference = extractBibleReference($el);
      const url = extractBibleUrl($el);
      const rawInnerHtml = $el.html() || '';
      const cleanedHtml = cleanBibleHtml(rawInnerHtml);

      blocks.push(buildBiblePassageBlock(reference, cleanedHtml, url));
      return;
    }
    if (isFilmReveal($el)) {
      const title = extractVideoField($el, /^Title:/i);
      const url = extractVideoField($el, /^URL:/i);
      const startTime = extractVideoField($el, /^Start Time/i);
      const endTime = extractVideoField($el, /^End Time/i);

      blocks.push(buildVideoBlock(title, url, startTime, endTime));
      return;
    }
    if (isCollapsibleSummary($el)) {
      const title = normalizeTextForEditor($el.text()).replace(/^\+\s*/, '');
      const $collapsed = getNextCollapsedDiv($, $el);

      if ($collapsed.length > 0) {
        const nestedBlocks = extractRevealContentBlocks($, $collapsed, popupMap);

        if (nestedBlocks.length > 0) {
          blocks.push(buildCollapsibleGroupBlock(title, nestedBlocks));
        } else {
          const fallbackHtml = normalizeInlineHtml($collapsed.html() || '');

          if (!isIgnorableHtml(fallbackHtml)) {
            blocks.push(buildCollapsibleGroupBlock(title, [buildParagraphBlock(fallbackHtml)]));
          }
        }
      }

      return;
    }
    if (isBackgroundNoteWrapper($el)) {
      const $lesson = $el.find('div.lesson').first();
      const title =
        normalizeTextForEditor($lesson.find('.lesson-subtitle').first().text()) ||
        'Background Notes';

      const $clone = $el.clone();

      $clone.find('div.lesson').remove();

      const nestedBlocks = extractRevealContentBlocks($, $clone, popupMap);

      if (nestedBlocks.length > 0) {
        blocks.push(buildCollapsibleGroupBlock(title, nestedBlocks));
      }

      return;
    }
    if (isBackgroundNoteWrapper($el)) {
      const $lesson = $el.find('div.lesson').first();
      const title =
        normalizeTextForEditor($lesson.find('.lesson-subtitle').first().text()) ||
        'Background Notes';

      const $clone = $el.clone();

      $clone.find('div.lesson').remove();

      const nestedBlocks = extractRevealContentBlocks($, $clone, popupMap);

      if (nestedBlocks.length > 0) {
        blocks.push(buildCollapsibleGroupBlock(title, nestedBlocks));
      }

      return;
    }
    if (isGospelPointLesson($el)) {
      const title = normalizeTextForEditor($el.find('.lesson-subtitle').first().text());

      const image = $el.find('img.lesson-icon').first().attr('src') || '';

      if (title) {
        blocks.push(buildHeaderBlock(title, 2, image));
      }

      return;
    }
    if (isSectionMarkerLesson($el)) {
      const title = getSectionTitle($el);
      const theme = getSectionTheme($el);
      const icon = getSectionIconKey($el);

      if (title) {
        blocks.push(buildSectionMarkerBlock(theme, title, icon));
      }

      return;
    }
    if ($el.hasClass && $el.hasClass('lesson')) {
      const hasSectionMarker = isSectionMarkerLesson($el);
      $el.contents().each((_, child) => {
        if (!isTag(child)) {
          return;
        }
        const $child = $(child);

        if ($child.is('.lesson-subtitle')) {
          return;
        }

        if (isPlainReveal($child)) {
          const $clone = $child.clone();

          const $heading = $clone
            .children('h1, h2, h3, h4, h5, h6, p')
            .filter((_, el) => !isIgnorableHtml($(el).html() || $(el).text()))
            .first();

          const title = normalizeTextForEditor($heading.text());

          if ($heading.length > 0) {
            $heading.remove();
          }

          const nestedBlocks = extractRevealContentBlocks($, $clone, popupMap);

          if (title) {
            blocks.push(buildCollapsibleGroupBlock(title, nestedBlocks));

            return;
          }
        }

        processNode($child);
      });

      if (hasSectionMarker) {
        const theme = getSectionTheme($el);
        const title = getSectionTitle($el);
        const icon = getSectionIconKey($el);
        blocks.push(buildSectionMarkerBlock(theme, title, icon));
      }

      return;
    }
    if (isBibleContainer($el)) {
      const reference = normalizeTextForEditor(extractBibleReference($el)) || 'Bible';
      const url = extractBibleUrl($el);
      const cleanedHtml = cleanBibleHtml($el.html() || '');

      blocks.push(buildBiblePassageBlock(reference, cleanedHtml, url));
      return;
    }
    if ($el.hasClass && $el.hasClass('myfriends-share')) {
      $el.contents().each((_, child) => {
        if (!isTag(child)) {
          if (isText(child)) {
            const text = normalizeTextForEditor(child.data || '');

            if (text) {
              blocks.push(buildParagraphBlock(text));
            }

            return;
          }
          return;
        }

        processNode($(child));
      });

      return;
    }
    if (isNoteArea($el)) {
      const rawKey =
        $el.attr('id')?.trim() || $el.find('form').first().attr('id')?.trim() || 'note';

      const storageKey = rawKey === 'note#' ? `note-${blocks.length + 1}` : rawKey;

      blocks.push(buildNotesAreaBlock(storageKey));
      return;
    }
    if (isCollapsibleBibleButton($el)) {
      const reference = normalizeTextForEditor($el.text()).replace(/^Read\s+/i, '');
      const $collapsed = getNextCollapsedDiv($, $el);

      if ($collapsed.length > 0) {
        const url = extractBibleUrl($collapsed);
        const cleanedHtml = cleanBibleHtml($collapsed.html() || '');

        blocks.push(buildBiblePassageBlock(reference, cleanedHtml, url));
      }

      return;
    }
    if (isLessonDiv($el)) {
      const $subtitle = $el.children('.lesson-subtitle').first();

      if ($subtitle.length > 0) {
        const sectionThemes: SectionTheme[] = ['back', 'up', 'forward'];
        const theme = sectionThemes[sectionIndex] || null;

        if (theme) {
          blocks.push(buildSectionMarkerBlock(theme));
          sectionIndex += 1;
          return;
        }
      }

      $el.contents().each((_, child) => {
        if (!isTag(child)) {
          return;
        }

        processNode($(child));
      });

      return;
    }
    // 3.Enrichment
    if ($el.is('div.for-enrichment')) {
      const html = normalizeInlineHtml($el.html() || '');

      if (!isIgnorableHtml(html)) {
        const block = buildParagraphBlock(html) as AnyEditorJsBlock & {
          data: {
            text?: string;
            bibleRefs?: BibleRef[];
            className?: string;
          };
        };

        block.data.className = 'for-enrichment';

        blocks.push(block);
      }

      return;
    }

    // 4. Bible reference popup conversion AFTER reveal/collapsible wrappers

    if ($el.find('a[href*="popUp"]').length > 0) {
      blocks.push(convertPopupLinksToBibleReferenceBlock($, $el, popupMap));
      return;
    }

    // 5. Ordinary content blocks

    if (isParagraph($el)) {
      const result = extractInlineBibleRefs($, $el, {
        normalizeInlineHtml,
        normalizeTextForEditor,
      });

      if (!isIgnorableHtml(result.html)) {
        blocks.push(buildParagraphBlock(result.html, result.bibleRefs));
      }

      return;
    }

    if (isHeadingTwo($el)) {
      const headingText = normalizeTextForEditor($el.text());

      if (headingText) {
        blocks.push(buildHeaderBlock(headingText, 2));
      }

      return;
    }

    if (isHeadingThree($el)) {
      const headingText = normalizeTextForEditor($el.text());

      if (headingText) {
        blocks.push(buildHeaderBlock(headingText, 3));
      }

      return;
    }

    if (isOrderedList($el)) {
      const block = buildListOrBibleReferenceBlock($, $el);
      if (block) {
        blocks.push(block);
      }

      return;
    }

    if ($el.is('ul.lesson-list')) {
      const items = extractLessonListItems($, $el);

      if (items.length > 0) {
        blocks.push({
          type: 'list',
          data: {
            style: 'unordered',
            variant: 'lesson-list',
            items,
          },
        });
      }

      return;
    }

    if (isUnorderedList($el)) {
      const block = buildListOrBibleReferenceBlock($, $el);

      if (block) {
        blocks.push(block);
      }

      return;
    }
    if (isOrderedListWrapper($el)) {
      const $directList = $el.children('ol').first();

      if ($directList.length) {
        const block = buildListOrBibleReferenceBlock($, $directList);

        if (block) {
          blocks.push(block);
        }
      }

      $el.children().each((_, child) => {
        const $child = $(child);

        if ($child.is('ol')) {
          return;
        }

        if (isBibleReveal($child)) {
          const reference = extractBibleReference($child);
          const url = extractBibleUrl($child);
          const rawInnerHtml = $child.html() || '';
          const cleanedHtml = cleanBibleHtml(rawInnerHtml);

          blocks.push(buildBiblePassageBlock(reference, cleanedHtml, url));
          return;
        }

        if (isFilmReveal($child)) {
          const title = extractVideoField($child, /^title:?$/i);
          const url = extractVideoField($child, /^url:?$/i);
          const startTime = extractVideoField($child, /^start time/i);
          const endTime = extractVideoField($child, /^end time/i);

          blocks.push(buildVideoBlock(title, url, startTime, endTime));
          return;
        }

        if (isTag(child)) {
          processNode($child);
        }
      });

      return;
    }

    if ($el.is('div.lesson-section-words, div.share')) {
      const html = normalizeInlineHtml($el.html() || $el.text() || '');

      if (!isIgnorableHtml(html)) {
        blocks.push(buildParagraphBlock(html));
      }

      return;
    }

    if ($el.is('div, section, article, form')) {
      $el.contents().each((_, child) => {
        if (!isTag(child)) {
          return;
        }

        processNode($(child));
      });

      return;
    }

    if ($el.is('img, br')) {
      return;
    }

    if ($el.is('a')) {
      const html = normalizeInlineHtml($.html($el));

      if (!isIgnorableHtml(html)) {
        blocks.push(buildParagraphBlock(html));
      }

      return;
    }

    const fallbackHtml = normalizeInlineHtml($el.html() || $el.text() || '');

    if (!isIgnorableHtml(fallbackHtml)) {
      blocks.push(buildParagraphBlock(fallbackHtml));
    }
  }

  const $root = $('#mycontent').first().length ? $('#mycontent').first() : $('body');

  $root.contents().each((index, el) => {
    if (!isTag(el)) {
      return;
    }

    const $el = $(el);

    processNode($el);
  });

  const firstSectionMarkerIndex = blocks.findIndex((block) => block.type === 'sectionMarker');

  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];

    if (!block) {
      continue;
    }

    if (block.type !== 'sectionMarker') {
      continue;
    }

    const isFirstSectionMarker = i === firstSectionMarkerIndex;
    const isBackgroundSection = block.data.icon === 'background';

    if (isFirstSectionMarker || isBackgroundSection) {
      continue;
    }

    const previousBlock = blocks[i - 1];

    if (previousBlock?.type === 'notesArea') {
      continue;
    }

    blocks.splice(i, 0, buildNotesAreaBlock('note'));
  }

  while (blocks[0]?.type === 'notesArea') {
    blocks.shift();
  }

  const content: EditorJsContent = {
    blocks,
  };

  if (options.includeTime) {
    content.time = Date.now();
  }

  if (options.includeVersion) {
    content.version = '2.31.5';
  }

  return content;
}
