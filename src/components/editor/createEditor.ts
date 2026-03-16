import EditorJS from '@editorjs/editorjs';

import { createEditorTools } from './createEditorTools';
import type { LanguageCode } from 'src/i18n';

type EditorBlockData = {
  id?: string;
  type: string;
  data: Record<string, unknown>;
};

type OutputData = {
  blocks: EditorBlockData[];
  time?: number;
  version?: string;
};

type CreateEditorOptions = {
  data?: OutputData;
  holder: string;
  lang: LanguageCode;
};

export type EditorInstance = {
  save: () => Promise<OutputData>;
  render: (data: OutputData) => Promise<void>;
  clear: () => void;
  destroy: () => void;
  isReady: Promise<void>;
  blocks: {
    insert: (
      type?: string,
      data?: Record<string, unknown>,
      config?: unknown,
      index?: number,
      needToFocus?: boolean,
    ) => void;
  };
};

export function createEditor({ holder, data, lang }: CreateEditorOptions): EditorInstance {
  return new EditorJS({
    holder,
    tools: createEditorTools(lang),
    ...(data ? { data } : {}),
  }) as EditorInstance;
}
