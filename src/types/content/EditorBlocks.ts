import type { BiblePassageBlockData } from './BiblePassageBlock';
import type { BibleReferenceBlockData } from './BibleReferenceBlock';
import type { CollapsibleGroupBlockData } from './CollapsibleGroupBlock';
import type { CollapsibleTextBlockData } from './CollapsibleTextBlock';
import type { DelimiterBlockData } from './DelimiterBlock';
import type { HeaderBlockData } from './HeaderBlock';
import type { ImageBlockData } from './ImageBlock';
import type { IWillBlockData } from './IWillBlock';
import type { LastTimeBlockData } from './LastTimeBlock';
import type { ListBlockData } from './ListBlock';
import type { NotesAreaBlockData } from './NotesAreaBlock';
import type { OikosListBlockData } from './OikosListBlock';
import type { ParagraphBlockData } from './ParagraphBlock';
import type { QuoteBlockData } from './QuoteBlock';
import type { SectionMarkerBlockData } from './SectionMarkerBlock';
import type { TitleBlockData } from './TitleBlock';
import type { VideoBlockData } from './VideoBlock';

export type EditorBlockType =
  | 'biblePassage'
  | 'bibleReference'
  | 'collapsibleGroup'
  | 'collapsibleText'
  | 'delimiter'
  | 'header'
  | 'iWill'
  | 'image'
  | 'lastTime'
  | 'list'
  | 'notesArea'
  | 'oikosList'
  | 'paragraph'
  | 'quote'
  | 'sectionMarker'
  | 'title'
  | 'video';

export type EditorBlockDataMap = {
  biblePassage: BiblePassageBlockData;
  bibleReference: BibleReferenceBlockData;
  collapsibleGroup: CollapsibleGroupBlockData;
  collapsibleText: CollapsibleTextBlockData;
  delimiter: DelimiterBlockData;
  header: HeaderBlockData;
  iWill: IWillBlockData;
  image: ImageBlockData;
  lastTime: LastTimeBlockData;
  list: ListBlockData;
  notesArea: NotesAreaBlockData;
  oikosList: OikosListBlockData;
  paragraph: ParagraphBlockData;
  quote: QuoteBlockData;
  sectionMarker: SectionMarkerBlockData;
  title: TitleBlockData;
  video: VideoBlockData;
};

export type EditorJsBlock<TType extends EditorBlockType = EditorBlockType> = {
  id?: string;
  type: TType;
  data: EditorBlockDataMap[TType];
};

export type AnyEditorJsBlock = {
  [K in EditorBlockType]: EditorJsBlock<K>;
}[EditorBlockType];

export type EditorJsContent = {
  time?: number;
  version?: string;
  blocks: AnyEditorJsBlock[];
};

export type EditorJsContentData = EditorJsContent;
