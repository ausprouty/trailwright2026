import type { AnyEditorJsBlock } from 'src/types/content/MigrationTypes';

export type SiteKey = 'myfriends';

export type TextDirection = 'ltr' | 'rtl';

export type NumberSystem = 'latn' | 'arab' | 'arabext' | 'deva' | 'taml' | 'ethi';

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
  // English
  eng: {
    htmlLang: 'en',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Arabic
  arb: {
    htmlLang: 'ar',
    direction: 'rtl',
    numberSystem: 'arab',
  },

  // Urdu
  urd: {
    htmlLang: 'ur',
    direction: 'rtl',
    numberSystem: 'arabext',
  },

  // Hindi
  hin: {
    htmlLang: 'hi',
    direction: 'ltr',
    numberSystem: 'deva',
  },

  // Tamil
  tam: {
    htmlLang: 'ta',
    direction: 'ltr',
    numberSystem: 'taml',
  },

  // Simplified Chinese
  cmn: {
    htmlLang: 'zh-Hans',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // German
  deu: {
    htmlLang: 'de',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Spanish
  spa: {
    htmlLang: 'es',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // French
  fra: {
    htmlLang: 'fr',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Portuguese
  por: {
    htmlLang: 'pt',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Finnish
  fin: {
    htmlLang: 'fi',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Afaan Oromoo
  orm: {
    htmlLang: 'om',
    direction: 'ltr',
    numberSystem: 'latn',
  },

  // Amharic / Ethiopian languages bucket
  amh: {
    htmlLang: 'am',
    direction: 'ltr',
    numberSystem: 'ethi',
  },
};

export const myFriendsCountries = [
  'AT',
  'AU',
  'BR',
  'CN',
  'DE',
  'EG',
  'ES',
  'ET',
  'FI',
  'FR',
  'HD',
  'IN',
  'LK',
  'NZ',
  'PK',
  'PT',
  'RO',
  'US',
] as const;

export type MyFriendsCountry = (typeof myFriendsCountries)[number];

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
  country: MyFriendsCountry;
  language: string;
  series: string;
  lessonId: string;
  sortOrder: number;
  blocks?: AnyEditorJsBlock[];
};

export function createLessonJson(options: CreateLessonJsonOptions): LessonJson {
  const {
    site = 'myfriends',
    country,
    language,
    series,
    lessonId,
    sortOrder,
    blocks = [],
  } = options;

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
