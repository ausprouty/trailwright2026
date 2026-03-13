import { getSafeLanguageCode, type LanguageCode } from "./index";

const STORAGE_KEY = "editor-language";

export function getCurrentLanguage(): LanguageCode {
  const saved = localStorage.getItem(STORAGE_KEY);
  return getSafeLanguageCode(saved);
}

export function setCurrentLanguage(lang: LanguageCode): void {
  localStorage.setItem(STORAGE_KEY, lang);
}