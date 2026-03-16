export type LanguageCode = string;

const STORAGE_KEY = 'editor-language';

export function getCurrentLanguage(): LanguageCode {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ?? 'en';
}

export function setCurrentLanguage(lang: LanguageCode): void {
  localStorage.setItem(STORAGE_KEY, lang);
}
