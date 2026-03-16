export type EditorBlockType =
  | 'paragraph'
  | 'header'
  | 'list'
  | 'oikosList'
  | 'videoEmbed'
  | 'biblePassage'
  | 'lastTime';

export type ParagraphBlockData = {
  text?: string;
};

export type HeaderBlockData = {
  text?: string;
  level?: number;
};

export type ListBlockData = {
  style?: 'ordered' | 'unordered';
  items?: string[];
};

export type OikosListBlockData = {
  title?: string;
  items?: string[];
};

export type VideoEmbedBlockData = {
  title?: string;
  url?: string;
  source?: string;
  refId?: string;
  startTime?: string;
  endTime?: string;
  isOpen?: boolean;
};

export type BiblePassageBlockData = {
  reference?: string;
  html?: string;
  title?: string;
  isOpen?: boolean;
};

export type LastTimeBlockData = Record<string, never>;

export type EditorBlockDataMap = {
  paragraph: ParagraphBlockData;
  header: HeaderBlockData;
  list: ListBlockData;
  oikosList: OikosListBlockData;
  videoEmbed: VideoEmbedBlockData;
  biblePassage: BiblePassageBlockData;
  lastTime: LastTimeBlockData;
};

export type EditorJsBlock<TType extends EditorBlockType = EditorBlockType> = {
  type: TType;
  data: EditorBlockDataMap[TType];
};

export type AnyEditorJsBlock = {
  [K in EditorBlockType]: EditorJsBlock<K>;
}[EditorBlockType];

export type EditorJsContent = {
  blocks: AnyEditorJsBlock[];
};

export type EditorJsContentData = EditorJsContent;
