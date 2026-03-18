import type { API } from '@editorjs/editorjs';
import type { LanguageCode } from 'src/i18n';
import type { LastTimeBlockData } from 'src/types/content/LastTimeBlock';

export type LastTimeToolConfig = {
  lang: LanguageCode;
};

export type LastTimeToolConstructorArgs = {
  api: API;
  config?: LastTimeToolConfig;
  data?: Partial<LastTimeBlockData>;
  readOnly?: boolean;
};
