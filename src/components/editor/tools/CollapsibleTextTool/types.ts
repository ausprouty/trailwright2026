import type { API } from '@editorjs/editorjs';
import type { CollapsibleTextBlockData } from 'src/types/content/CollapsibleTextBlock';

export type CollapsibleTextToolConfig = Record<string, unknown>;

export type CollapsibleTextToolConstructorArgs = {
  api: API;
  config?: CollapsibleTextToolConfig;
  data?: Partial<CollapsibleTextBlockData>;
  readOnly?: boolean;
};
