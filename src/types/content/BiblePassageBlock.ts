import type { API } from '@editorjs/editorjs';
import type { LanguageCode } from 'src/i18n';

export type BiblePassageBlockData = {
  reference: string;
  html: string;
  url: string;
  isOpen: boolean;
};

export type BiblePassageToolConfig = {
  endpointPath?: string;
  languageCodeGoogle?: string;
  lang?: LanguageCode;
};

export type BiblePassageToolConstructorArgs = {
  data?: Partial<BiblePassageBlockData>;
  api: API;
  config?: BiblePassageToolConfig;
  readOnly?: boolean;
};

export const DEFAULT_BIBLE_PASSAGE_BLOCK_DATA: BiblePassageBlockData = {
  reference: '',
  html: '',
  url: '',
  isOpen: false,
};
