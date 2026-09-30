import type { OutputData } from '@editorjs/editorjs';

export type TextAreaBibleReferenceStatus = 'not_loaded' | 'loaded' | 'error';

export type TextAreaBibleReference = {
  id?: string;
  marker: string;
  label: string;
  passage?: string;
  status?: TextAreaBibleReferenceStatus;
};

export type TextAreaBlockData = {
  content: OutputData;
  references?: TextAreaBibleReference[];
};

export const DEFAULT_TEXT_AREA_BLOCK_DATA: TextAreaBlockData = {
  content: {
    time: Date.now(),
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: '',
        },
      },
    ],
    version: '2.31.5',
  },
  references: [],
};
