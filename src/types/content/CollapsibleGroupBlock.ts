import type { OutputData } from '@editorjs/editorjs';

export type CollapsibleGroupBibleReferenceStatus = 'not_loaded' | 'loaded' | 'error';

export type CollapsibleGroupBibleReference = {
  id?: string;
  marker: string;
  label: string;
  passage?: string;
  status?: CollapsibleGroupBibleReferenceStatus;
};

export type CollapsibleGroupBlockData = {
  title: string;
  isOpen: boolean;
  content: OutputData;
  references?: CollapsibleGroupBibleReference[];
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
    version: '2.31.5',
  },
  references: [],
};
