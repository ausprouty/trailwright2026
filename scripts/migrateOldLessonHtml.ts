import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

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

function mapSectionTheme(text: string): SectionTheme {
  const normalized = text.trim().toUpperCase();

  if (normalized === 'LOOK BACK') {
    return 'back';
  }

  if (normalized === 'LOOK UP') {
    return 'up';
  }

  if (normalized === 'LOOK FORWARD') {
    return 'forward';
  }

  throw new Error(`Unknown section title: ${text}`);
}

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

function cleanBibleHtml(rawHtml: string): string {
  const $ = cheerio.load(`<div id="root">${rawHtml}</div>`);
  const $root = $('#root');

  $root.find('hr').remove();
  $root.find('a.readmore').remove();

  $root.find('p.reference').remove();

  $root.find('br').each((_, el) => {
    const $el = $(el);
    const next = $el.next();

    if (!next.length) {
      $el.remove();
    }
  });

  return $root.html()?.trim() || '';
}
function extractBibleReference($container: cheerio.Cheerio<AnyNode>): string {
  return $container.find('p.reference').first().text().trim();
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
function buildSectionMarkerBlock(theme: SectionTheme): AnyEditorJsBlock {
  return {
    type: 'sectionMarker',
    data: {
      theme,
    },
  };
}

function buildListBlock(items: string[]): AnyEditorJsBlock {
  return {
    type: 'list',
    data: {
      style: 'ordered',
      items,
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

function isOrderedListWrapper($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.ol');
}

function isBibleReveal($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.reveal.bible');
}

function isFilmReveal($el: cheerio.Cheerio<AnyNode>): boolean {
  return $el.is('div.reveal.film');
}

function extractBibleUrl($container: cheerio.Cheerio<AnyNode>): string {
  const href = $container.find('a.readmore').first().attr('href');
  return typeof href === 'string' ? href.trim() : '';
}

export function migrateOldLessonHtmlToEditorJs(
  html: string,
  options: MigrateOptions = {},
): EditorJsContent {
  const $ = cheerio.load(html);

  const blocks: AnyEditorJsBlock[] = [];

  $('body')
    .children()
    .each((_, el) => {
      const $el = $(el);

      if (isLessonDiv($el)) {
        const subtitle = $el.find('.lesson-subtitle').first().text().trim();
        const theme = mapSectionTheme(subtitle);

        blocks.push(buildSectionMarkerBlock(theme));
        return;
      }
      if (isOrderedListWrapper($el)) {
        // 1. Extract the list
        const items = $el
          .find('ol > li')
          .map((__, li) => $(li).html()?.trim() || '')
          .get()
          .filter(Boolean);

        if (items.length > 0) {
          blocks.push(buildListBlock(items));
        }

        // 2. Process nested reveals INSIDE the .ol
        $el.children().each((__, child) => {
          const $child = $(child);

          if (isBibleReveal($child)) {
            const reference = extractBibleReference($child);
            const url = extractBibleUrl($child);
            const rawInnerHtml = $child.html() || '';
            const cleanedHtml = cleanBibleHtml(rawInnerHtml);

            blocks.push(buildBiblePassageBlock(reference, cleanedHtml, url));
          }

          if (isFilmReveal($child)) {
            const title = extractVideoField($child, /^title:?$/i);
            const url = extractVideoField($child, /^url:?$/i);
            const startTime = extractVideoField($child, /^start time/i);
            const endTime = extractVideoField($child, /^end time/i);

            blocks.push(buildVideoBlock(title, url, startTime, endTime));
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
      }
    });

  const content: EditorJsContent = {
    blocks,
  };

  if (options.includeTime) {
    content.time = Date.now();
  }

  if (options.includeVersion) {
    content.version = '2.31.0';
  }

  return content;
}
