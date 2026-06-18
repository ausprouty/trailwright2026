import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode, Text } from 'domhandler';
import { isText } from 'domhandler';

export type PopupBibleReference = {
  id: string;
  marker: string;
  label: string;
  passage: string;
};

function cleanInlineHtmlText(html: string): string {
  return (
    html
      // Remove empty spacer paragraphs.
      .replace(/<p>(?:&nbsp;|\s|\u00a0)*<\/p>/gi, '')

      // Remove line breaks.
      .replace(/\r?\n+/g, ' ')

      // Collapse repeated whitespace.
      .replace(/\s{2,}/g, ' ')

      // Remove whitespace directly after opening tags.
      .replace(/>\s+/g, '>')

      // Remove whitespace directly before closing tags.
      .replace(/\s+</g, '<')

      // Tidy spaces around paragraph boundaries.
      .replace(/<\/p>\s*<p/g, '</p><p')

      .trim()
  );
}

export type PopupBibleReferenceResult = {
  html: string;
  references: PopupBibleReference[];
  hasReferences: boolean;
};
function isTextNode(node: AnyNode | null | undefined): node is Text {
  return !!node && isText(node);
}

function getPopupIdFromHref(href: string): string | undefined {
  const match = href.match(/popUp\(\s*['"]([^'"]+)['"]\s*\)/i);
  return match?.[1];
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function removeClassName($: CheerioAPI, $scope: Cheerio<AnyNode>, className: string): void {
  $scope.find(`.${className}`).each((_, el) => {
    const $el = $(el);

    const classes = ($el.attr('class') || '')
      .split(/\s+/)
      .filter((item) => item && item !== className);

    if (classes.length > 0) {
      $el.attr('class', classes.join(' '));
    } else {
      $el.removeAttr('class');
    }
  });
}

function getPopupPassageHtml($: CheerioAPI, $popup: Cheerio<AnyNode>): string {
  const pieces: string[] = [];

  $popup.find('.bible_text').each((_, el) => {
    const $text = $(el).clone();

    // Keep the verse number sup tags, but remove legacy styling classes.
    $text.find('sup.versenum').removeAttr('class');

    const html = ($text.html() || '').trim();

    if (html) {
      pieces.push(html);
    }
  });

  // Fallback for popups that do not use .bible_text.
  if (pieces.length === 0) {
    const $clone = $popup.clone();
    $clone.find('sup.versenum').removeAttr('class');

    const html = ($clone.html() || '').trim();

    if (html) {
      pieces.push(html);
    }
  }

  return pieces.join('<br><br>');
}

function moveTrailingTextAfterPopupIntoPreviousParagraph(
  $: CheerioAPI,
  $popup: Cheerio<AnyNode>,
): void {
  const popupNode = $popup[0];

  if (!popupNode) {
    return;
  }

  const nextNode = popupNode.nextSibling;

  if (!isTextNode(nextNode)) {
    return;
  }

  const trailingText = nextNode.data.trim();

  if (!trailingText) {
    return;
  }

  const $previousParagraph = $popup.prevAll('p').first();

  if (!$previousParagraph.length) {
    return;
  }

  $previousParagraph.append(escapeHtml(trailingText));
  $(nextNode).remove();
}

export function extractPopupBibleReferences(
  $: CheerioAPI,
  $scope: Cheerio<AnyNode>,
): PopupBibleReferenceResult {
  removeClassName($, $scope, 'nobreak');

  const popupPassages = new Map<string, string>();

  $scope.find('div.popup[id]').each((_, el) => {
    const $popup = $(el);
    const popupId = $popup.attr('id');

    if (!popupId) {
      return;
    }

    const passage = getPopupPassageHtml($, $popup);

    if (passage) {
      popupPassages.set(popupId, passage);
    }
  });

  const references: PopupBibleReference[] = [];
  const usedPopupIds = new Set<string>();

  $scope.find('a[href]').each((_, el) => {
    const $link = $(el);
    const href = $link.attr('href') || '';
    const popupId = getPopupIdFromHref(href);

    if (!popupId) {
      return;
    }

    const passage = popupPassages.get(popupId);

    if (!passage) {
      return;
    }

    const label = normalizeText($link.text());

    if (!label) {
      return;
    }

    usedPopupIds.add(popupId);

    references.push({
      id: `popup_${popupId}`,
      marker: label,
      label,
      passage,
    });

    $link.replaceWith(`{${escapeHtml(label)}}`);
  });

  $scope.find('div.popup[id]').each((_, el) => {
    const $popup = $(el);
    const popupId = $popup.attr('id');

    if (!popupId || !usedPopupIds.has(popupId)) {
      return;
    }

    moveTrailingTextAfterPopupIntoPreviousParagraph($, $popup);
    $popup.remove();
  });

  return {
    html: cleanInlineHtmlText($scope.html() || ''),
    references,
    hasReferences: references.length > 0,
  };
}
