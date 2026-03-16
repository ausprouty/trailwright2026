import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'pt', 'zh-CN', 'zh-TW'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageOption {
  code: LanguageCode;
  label: string;
}

export const messages: Record<LanguageCode, unknown> = {
  en,
  es,
  fr,
  pt,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export const languageOptions: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
];

export function getMessages(lang: LanguageCode): unknown {
  return messages[lang] || messages.en;
}

export function isLanguageCode(value: string): value is LanguageCode {
  return Object.prototype.hasOwnProperty.call(messages, value);
}

export function getSafeLanguageCode(value: string | null | undefined): LanguageCode {
  if (value && isLanguageCode(value)) {
    return value;
  }

  return 'en';
}

export function t(lang: LanguageCode, path: string): string {
  const parts = path.split('.');
  let current: unknown = getMessages(lang);

  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}
