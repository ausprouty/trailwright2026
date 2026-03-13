import { type ComputedRef } from 'vue';

type SiteSection = {
  paras?: string[];
  empty?: string;
};

export function useSiteContent(languageCodeIso: ComputedRef<string>) {
  function getSection(sectionName: string): SiteSection {
    console.log('[useSiteContent] getSection', {
      sectionName,
      languageCodeIso: languageCodeIso.value,
    });

    if (sectionName === 'review') {
      return {
        paras: ['Before we begin, let us review what you committed to last time.'],
        empty: 'There is no previous note to review yet.',
      };
    }

    return {};
  }

  return {
    getSection,
  };
}
