import type { CollapsibleGroupBlockData } from 'src/types/content/CollapsibleGroupBlock';

export type EditorToolConfig = Record<string, object>;

export type CollapsibleGroupConfig = {
  tools: EditorToolConfig;
  placeholder?: string;
};

export type CollapsibleGroupData = CollapsibleGroupBlockData;

export type CollapsibleGroupToolConstructorArgs = {
  data?: Partial<CollapsibleGroupData>;
  config?: CollapsibleGroupConfig;
  readOnly?: boolean;
};
