export type ListBlockData = {
  style?: 'ordered' | 'unordered';
  variant?: string;
  items?: ListItem[];
};

export type ListItem =
  | string
  | {
      text: string;
      icon?: string;
      children?: ListBlockData;
    };
