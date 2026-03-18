import type { API } from '@editorjs/editorjs';
import type { TitleBlockData } from 'src/types/content/TitleBlock';

export type TitleToolOption = {
  value: string;
  label: string;
};

export type TitleToolConfig = {
  languages?: TitleToolOption[];
  seriesOptions?: TitleToolOption[];
};

export type TitleToolConstructorArgs = {
  data?: Partial<TitleBlockData>;
  api: API;
  config?: TitleToolConfig;
  readOnly?: boolean;
};
