/*
import { getDirectionFromLang } from 'src/utils/textDirection';
const pageDir = computed(() => getDirectionFromLang(selectedLanguage.value)
<div :lang="selectedLanguage" :dir="pageDir">

For individual paragraphs or blocks, normalizeDirection() is useful when a block may store ltr, rtl, or auto.

*/

export type TextDirection = 'ltr' | 'rtl' | 'auto';

const RTL_LANGUAGE_CODES = ['ar', 'fa', 'he', 'ur'];

export function getBaseLanguageCode(lang?: string): string {
  if (!lang) {
    return '';
  }

  return lang.toLowerCase().split('-')[0] || '';
}

export function isRtlLanguage(lang?: string): boolean {
  const baseLanguageCode = getBaseLanguageCode(lang);

  return RTL_LANGUAGE_CODES.includes(baseLanguageCode);
}

export function getDirectionFromLang(lang?: string): TextDirection {
  if (!lang) {
    return 'ltr';
  }

  return isRtlLanguage(lang) ? 'rtl' : 'ltr';
}

export function normalizeDirection(dir?: string | null): TextDirection {
  if (dir === 'rtl') {
    return 'rtl';
  }

  if (dir === 'ltr') {
    return 'ltr';
  }

  return 'auto';
}
