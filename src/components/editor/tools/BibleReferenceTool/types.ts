export type BibleReferenceItem = {
  id: string;
  marker: string;
  label: string;
  passage: string;
};

export type BibleReferenceToolData = {
  text: string;
  references: BibleReferenceItem[];
  isOpen?: boolean;
};

