export type OikosListItem = {
  name?: string;
  relationship?: string;
  notes?: string;
};

export type OikosListBlockData = {
  title?: string;
  items?: OikosListItem[];
};
