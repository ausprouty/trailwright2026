import type { AnyEditorJsBlock } from 'src/types/content/MigrationTypes';

export type SiteKey = 'mc2';

export type TextDirection = 'ltr' | 'rtl';

export type NumberSystem = 'latn' | 'arab' | 'arabext' | 'deva' | 'taml' | 'ethi'|'mymr';

export type LessonJson = {
  site: SiteKey;
  country: string;
  language: string;
  htmlLang: string;
  direction: TextDirection;
  numberSystem: NumberSystem;
  series: string;
  lessonId: string;
  sortOrder: number;
  blocks: AnyEditorJsBlock[];
};

type LanguageMeta = {
  htmlLang: string;
  direction: TextDirection;
  numberSystem: NumberSystem;
};


const languageMetaByCode: Record<string, LanguageMeta> = {
  // Amharic
  amh: {
    htmlLang: 'am',
    direction: 'ltr',
    numberSystem: 'ethi',
  },

  // Simplified Chinese
  cmn: {
    htmlLang: 'zh-Hans',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Traditional Chinese
  cmt: {
    htmlLang: 'zh-Hant',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // English
  eng: {
    htmlLang: 'en',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // French
  fra: {
    htmlLang: 'fr',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Japanese
  jpn: {
    htmlLang: 'ja',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Burmese / Myanmar
  mya: {
    htmlLang: 'my',
    direction: 'ltr',
    numberSystem: 'mymr',
  },

  // Portuguese
  por: {
    htmlLang: 'pt',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Spanish
  spa: {
    htmlLang: 'es',
    direction: 'ltr',
    numberSystem: 'latn',
  },
};

export const mc2Countries = ['M2'] as const;

export type Mc2Country = (typeof mc2Countries)[number];

export function getLanguageMeta(language: string): LanguageMeta {
  const meta = languageMetaByCode[language];

  if (meta) {
    return meta;
  }

  return {
    htmlLang: language,
    direction: 'ltr',
    numberSystem: 'latn',
  };
}

type CreateLessonJsonOptions = {
  site?: SiteKey;
  country: Mc2Country;
  language: string;
  series: string;
  lessonId: string;
  sortOrder: number;
  blocks?: AnyEditorJsBlock[];
};

export function createLessonJson(options: CreateLessonJsonOptions): LessonJson {
  const { site = 'mc2', country, language, series, lessonId, sortOrder, blocks = [] } = options;

  const languageMeta = getLanguageMeta(language);

  return {
    site,
    country,
    language,
    htmlLang: languageMeta.htmlLang,
    direction: languageMeta.direction,
    numberSystem: languageMeta.numberSystem,
    series,
    lessonId,
    sortOrder,
    blocks,
  };
}
