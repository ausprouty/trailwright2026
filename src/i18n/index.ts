import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';

export type LanguageCode = 'en' | 'es' | 'fr' | 'pt' | 'zh-CN' | 'zh-TW';

export const messages = {
  en,
  es,
  fr,
  pt,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export function t(languageCode: LanguageCode, key: string): string {
  const messageSet = messages[languageCode] as Record<string, unknown>;
  const parts = key.split('.');

  let current: unknown = messageSet;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  return typeof current === 'string' ? current : key;
}
