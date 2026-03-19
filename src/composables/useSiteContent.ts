import { type ComputedRef } from 'vue';

type SiteSection = {
  paras?: string[];
  empty?: string;
};

export function useSiteContent(languageCodeGoogle: ComputedRef<string>) {
  function getSection(sectionName: string): SiteSection {
    console.log('[useSiteContent] getSection', {
      sectionName,
      languageCodeGoogle: languageCodeGoogle.value,
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
