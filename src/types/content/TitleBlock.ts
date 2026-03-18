export type TitleBlockData = {
  seriesNumber: string;
  title: string;
  language: string;
  series: string;
  isOpen: boolean;
};

export const DEFAULT_TITLE_BLOCK_DATA: TitleBlockData = {
  seriesNumber: '',
  title: '',
  language: 'english',
  series: 'multiply1',
  isOpen: true,
};
