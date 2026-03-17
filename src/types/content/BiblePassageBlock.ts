export type BiblePassageBlockData = {
  reference: string;
  html: string;
  isOpen: boolean;
};

export const DEFAULT_BIBLE_PASSAGE_BLOCK_DATA: BiblePassageBlockData = {
  reference: '',
  html: '',
  isOpen: false,
};
