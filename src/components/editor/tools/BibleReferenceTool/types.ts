import type { BibleToolConfig } from '../shared/fetchBiblePassage';
import type { BibleReferenceBlockData } from 'src/types/content/BibleReferenceBlock';

export type BibleReferenceToolData = BibleReferenceBlockData;

export type EditorJSToolConstructorArgs = {
  data?: Partial<BibleReferenceToolData>;
  api: unknown;
  config?: BibleToolConfig;
  readOnly?: boolean;
};
