export type ListItem =
  | string
  | {
      text: string;
      icon?: string;
    };

export type ListBlockData = {
  style?: 'ordered' | 'unordered';
  variant?: string;
  items?: ListItem[];
};
