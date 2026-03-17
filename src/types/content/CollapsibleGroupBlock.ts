import type { OutputData } from '@editorjs/editorjs';

export type CollapsibleGroupBlockData = {
  title: string;
  isOpen: boolean;
  content: OutputData;
};

export const DEFAULT_COLLAPSIBLE_GROUP_BLOCK_DATA: CollapsibleGroupBlockData = {
  title: '',
  isOpen: true,
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
