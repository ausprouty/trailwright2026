import { defineStore } from 'pinia';

type LanguageTextObjectSelected = {
  languageCodeGoogle?: string;
};

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    currentStudySelected: '' as string,
    textLanguageObjectSelected: {
      languageCodeGoogle: 'en',
    } as LanguageTextObjectSelected,
  }),
});
