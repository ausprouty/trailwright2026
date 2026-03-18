import type { API } from '@editorjs/editorjs';
import type { NotesAreaBlockData } from 'src/types/content/NotesAreaBlock';

export type NotesAreaToolConfig = Record<string, unknown>;

export type NotesAreaToolConstructorArgs = {
  api: API;
  config?: NotesAreaToolConfig;
  data?: Partial<NotesAreaBlockData>;
  readOnly?: boolean;
};
