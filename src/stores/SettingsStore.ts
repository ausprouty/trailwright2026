import { defineStore } from 'pinia';

type LanguageTextObjectSelected = {
  languageCodeIso?: string;
};

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    currentStudySelected: '' as string,
    textLanguageObjectSelected: {
      languageCodeIso: 'en',
    } as LanguageTextObjectSelected,
  }),
});
