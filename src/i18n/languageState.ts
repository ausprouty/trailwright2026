import { isLanguageCode, type LanguageCode } from 'src/i18n';

const STORAGE_KEY = 'editor-language';

export function getCurrentLanguage(): LanguageCode {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved && isLanguageCode(saved)) {
    return saved;
  }

  return 'en';
}

export function setCurrentLanguage(lang: LanguageCode): void {
  localStorage.setItem(STORAGE_KEY, lang);
}
