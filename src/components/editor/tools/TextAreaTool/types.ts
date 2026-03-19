import type { TextAreaBlockData } from 'src/types/content/TextAreaBlock';

export type TextAreaToolConfig = {
  tools: Record<string, object>;
};

export type TextAreaToolConstructorArgs = {
  data?: Partial<TextAreaBlockData>;
  config?: TextAreaToolConfig;
  readOnly?: boolean;
};
