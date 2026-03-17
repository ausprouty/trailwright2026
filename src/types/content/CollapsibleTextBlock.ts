export type CollapsibleTextBlockData = {
  body: string;
  heading: string;
  isOpen: boolean;
};

export const DEFAULT_COLLAPSIBLE_TEXT_BLOCK_DATA: CollapsibleTextBlockData = {
  body: '',
  heading: '',
  isOpen: false,
};
