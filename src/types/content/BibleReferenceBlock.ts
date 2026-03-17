import type { BibleReferenceItem } from 'src/types/shared/BibleReferenceItem';

export type BibleReferenceBlockData = {
  text: string;
  references: BibleReferenceItem[];
  isOpen: boolean;
};

export const DEFAULT_BIBLE_REFERENCE_BLOCK_DATA: BibleReferenceBlockData = {
  text: '',
  references: [],
  isOpen: false,
};
