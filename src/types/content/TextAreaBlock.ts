import type { OutputData } from '@editorjs/editorjs';

export type TextAreaBlockData = {
  content: OutputData;
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
  },
};
