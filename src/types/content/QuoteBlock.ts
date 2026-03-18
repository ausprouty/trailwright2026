export type QuoteBlockData = {
  text: string;
  caption: string;
  alignment: 'left' | 'center';
};

export const DEFAULT_QUOTE_BLOCK_DATA: QuoteBlockData = {
  text: '',
  caption: '',
  alignment: 'left',
};
