export type EditorBlockType =
  | 'paragraph'
  | 'header'
  | 'list'
  | 'oikosList'
  | 'videoEmbed'
  | 'biblePassage'
  | 'lastTime';

export type EditorJsBlock = {
  type: EditorBlockType;
  data: unknown;
};

export type EditorJsContent = {
  blocks?: EditorJsBlock[];
};
