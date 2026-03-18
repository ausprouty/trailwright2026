import type { API } from '@editorjs/editorjs';
import type { OikosListBlockData } from 'src/types/content/OikosListBlock';

export type OikosListToolConfig = Record<string, never>;

export type OikosListToolConstructorArgs = {
  api: API;
  config?: OikosListToolConfig;
  data?: Partial<OikosListBlockData>;
  readOnly?: boolean;
};
