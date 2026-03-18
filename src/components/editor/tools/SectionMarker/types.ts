import type { API } from '@editorjs/editorjs';
import type { SectionMarkerBlockData, SectionTheme } from 'src/types/content/SectionMarkerBlock';

export type SectionOption = {
  value: SectionTheme;
  labelKey: string;
};

export type SectionMarkerToolConstructorArgs = {
  api: API;
  config?: Record<string, never>;
  data?: Partial<SectionMarkerBlockData>;
  readOnly?: boolean;
};
