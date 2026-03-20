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
    render: (data: OutputData) => Promise<void>;
  };
};

function toPlainOutput(data?: OutputData): OutputData | undefined {
  if (!data) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(data)) as OutputData;
}

export function createEditor({ holder, data, lang }: CreateEditorOptions): EditorInstance {
  const plainData = toPlainOutput(data);

  const config = plainData
    ? {
        holder,
        tools: createEditorTools(lang),
        data: plainData,
      }
    : {
        holder,
        tools: createEditorTools(lang),
      };

  const editor = new EditorJS(config) as EditorInstance;

  editor.render = async (nextData: OutputData): Promise<void> => {
    await editor.isReady;
    await editor.blocks.render(toPlainOutput(nextData) as OutputData);
  };

  return editor;
}
