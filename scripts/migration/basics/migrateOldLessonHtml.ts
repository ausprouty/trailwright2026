import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { isTag } from 'domhandler';

import type {
  EditorJsContent,
  AnyEditorJsBlock,
  SectionTheme,
  VideoSource,
} from 'src/types/content/MigrationTypes';

type MigrateOptions = {
  includeTime?: boolean;
  includeVersion?: boolean;
};

function parseArclightRefId(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('refId') || '';
  } catch {
    return '';
  }
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
function looksLikeBibleReference(text: string): boolean {
  return /^[1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:-\d+)?$/.test(text.trim());
}

function cleanBibleHtml(rawHtml: string): string {
  const $ = cheerio.load(`<div id="root">${rawHtml}</div>`);
  const $root = $('#root');

  $root.find('hr').remove();
  $root.find('a.bible-readmore, a.readmore').remove();
  $root.find('p.reference').remove();
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
  const cleanedHtml = normalizeInlineHtml($root.html() || '');

  return cleanedHtml;
}

function extractBibleReference($container: cheerio.Cheerio<AnyNode>): string {
  const explicitReference = $container.find('p.reference').first().text().trim();

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

function normalizeVideoLabel(label: string): string {
  return label.replace(/\s+/g, ' ').replace(/\s+:/g, ':').trim().toLowerCase();
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

function extractBibleUrl($container: cheerio.Cheerio<AnyNode>): string {
  const href = $container.find('a.bible-readmore, a.readmore').first().attr('href');
  return typeof href === 'string' ? href.trim() : '';
}

function buildSectionMarkerBlock(theme: SectionTheme): AnyEditorJsBlock {
  return {
    type: 'sectionMarker',
    data: {
      theme,
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

function buildParagraphBlock(html: string): AnyEditorJsBlock {
  return {
    type: 'paragraph',
    data: {
      text: html,
    },
  };
}

function buildHeaderBlock(text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 3): AnyEditorJsBlock {
  return {
    type: 'header',
    data: {
      text,
      level,
    },
  };
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

function buildBiblePassageBlock(reference: string, html: string, url: string): AnyEditorJsBlock {
  return {
    type: 'biblePassage',
    data: {
      reference,
      html,
      url,
      isOpen: true,
    },
  };
}
function buildCollapsibleGroupBlock(
  title: string,
  contentBlocks: AnyEditorJsBlock[],
): AnyEditorJsBlock {
  return {
    type: 'collapsibleGroup',
    data: {
      title,
      isOpen: true,
      content: {
        blocks: contentBlocks,
        version: '2.31.5',
      },
    },
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
      isOpen: true,
      isEditing: false,
    },
  };
}

function isLessonDiv($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.lesson');
}

function isNoteArea($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.note-area');
}

function isOrderedListWrapper($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.ol');
}

function isParagraph($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('p');
}

function isHeadingTwo($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('h2');
}

function isHeadingThree($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('h3');
}

function isOrderedList($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('ol');
}
function isPlainReveal($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.reveal') && !isBibleReveal($el) && !isFilmReveal($el);
}

function isUnorderedList($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('ul');
}

function isBibleReveal($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.reveal.bible');
}

function isFilmReveal($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.reveal.film');
}

function extractListItems($: cheerio.CheerioAPI, $list: cheerio.Cheerio<AnyNode>): string[] {
  return $list
    .children('li')
    .map((_, li) => normalizeTextForEditor(normalizeInlineHtml($(li).html() || '')))
    .get()
    .filter(Boolean);
}
function extractRevealContentBlocks(
  $: cheerio.CheerioAPI,
  $container: cheerio.Cheerio<AnyNode>,
): AnyEditorJsBlock[] {
  const nestedBlocks: AnyEditorJsBlock[] = [];

  $container.contents().each((_, child) => {
    if (!isTag(child)) {
      return;
    }

    const $child = $(child);

    if ($child.is('h1, h2, h3, hr')) {
      return;
    }

    if ($child.hasClass('background-text')) {
      const text = normalizeInlineHtml($child.html() || '');

      if (!isIgnorableHtml(text)) {
        nestedBlocks.push(buildParagraphBlock(text));
      }

      return;
    }

    const html = normalizeInlineHtml($child.html() || $child.text() || '');

    if (!isIgnorableHtml(html)) {
      nestedBlocks.push(buildParagraphBlock(html));
    }
  });

  return nestedBlocks;
}

function isIgnorableHtml(html: string): boolean {
  const textOnly = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return textOnly === '';
}

function trimNbspEdges(text: string): string {
  return text.replace(/^(?:\s|&nbsp;|\u00A0)+/gi, '').replace(/(?:\s|&nbsp;|\u00A0)+$/gi, '');
}

function collapsePlainTextWhitespace(text: string): string {
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function decodeHtmlEntities(text: string): string {
  const $ = cheerio.load(`<div id="decode-root">${text}</div>`);
  return $('#decode-root').text();
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

  cleaned = trimNbspEdges(cleaned);

  return cleaned.trim();
}

function normalizeTextForEditor(text: string): string {
  if (!text) {
    return '';
  }

  return collapsePlainTextWhitespace(decodeHtmlEntities(trimNbspEdges(text)));
}

export function migrateOldLessonHtmlToEditorJs(
  html: string,
  options: MigrateOptions = {},
): EditorJsContent {
  const $ = cheerio.load(html);
  const blocks: AnyEditorJsBlock[] = [];
  let sectionIndex = 0;

  function processNode($el: cheerio.Cheerio<AnyNode>): void {
    if (isPlainReveal($el)) {
      const $clone = $el.clone();
      const $heading = $clone.children('h1, h2, h3, h4, h5, h6').first();
      const title = normalizeTextForEditor($heading.text());

      if ($heading.length > 0) {
        $heading.remove();
      }

      const nestedBlocks = extractRevealContentBlocks($, $clone);

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

    if (isNoteArea($el)) {
      const rawKey =
        $el.attr('id')?.trim() || $el.find('form').first().attr('id')?.trim() || 'note';

      const storageKey = rawKey === 'note#' ? `note-${blocks.length + 1}` : rawKey;

      blocks.push(buildNotesAreaBlock(storageKey));
      return;
    }

    if (isParagraph($el)) {
      const paragraphHtml = normalizeInlineHtml($el.html() || '');

      if (!isIgnorableHtml(paragraphHtml)) {
        blocks.push(buildParagraphBlock(paragraphHtml));
      }

      return;
    }

    if (isHeadingTwo($el)) {
      const headingText = $el.text().trim();

      if (headingText) {
        blocks.push(buildHeaderBlock(headingText, 2));
      }

      return;
    }

    if (isHeadingThree($el)) {
      const headingText = $el.text().trim();

      if (headingText) {
        blocks.push(buildHeaderBlock(headingText, 3));
      }

      return;
    }

    if (isOrderedList($el)) {
      const items = extractListItems($, $el);

      if (items.length > 0) {
        blocks.push(buildListBlock('ordered', items));
      }

      return;
    }

    if (isUnorderedList($el)) {
      const items = extractListItems($, $el);

      if (items.length > 0) {
        blocks.push(buildListBlock('unordered', items));
      }

      return;
    }

    if (isOrderedListWrapper($el)) {
      const $directList = $el.children('ol').first();

      if ($directList.length) {
        const items = extractListItems($, $directList);

        if (items.length > 0) {
          blocks.push(buildListBlock('ordered', items));
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

    const fallbackHtml = normalizeInlineHtml($el.html() || $el.text() || '');

    if (!isIgnorableHtml(fallbackHtml)) {
      blocks.push(buildParagraphBlock(fallbackHtml));
    }
  }

  const $root = $('#mycontent').first().length ? $('#mycontent').first() : $('body');

  $root.contents().each((_, el) => {
    if (!isTag(el)) {
      return;
    }

    processNode($(el));
  });

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
