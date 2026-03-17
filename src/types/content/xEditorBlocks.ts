export type EditorBlockType =
  | 'paragraph'
  | 'header'
  | 'list'
  | 'oikosList'
  | 'videoEmbed'
  | 'biblePassage'
  | 'lastTime';

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
