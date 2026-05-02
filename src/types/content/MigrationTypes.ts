export type { EditorBlockType } from './EditorBlocks';

export type {
  AnyEditorJsBlock,
  EditorJsBlock,
  EditorJsContent,
  EditorJsContentData,
} from './EditorBlocks';

export type { BiblePassageBlockData } from './BiblePassageBlock';
export type { ListBlockData } from './ListBlock';
export type { SectionMarkerBlockData, SectionTheme } from './SectionMarkerBlock';

export type { VideoBlockData, VideoSource } from './VideoBlock';
export type BibleRef = {
  id: string;
  reference: string;
  html: string;
  instructionKey?: string;
};
