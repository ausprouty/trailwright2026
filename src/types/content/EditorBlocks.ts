import type { BiblePassageBlockData } from './BiblePassageBlock';
import type { HeaderBlockData } from './HeaderBlock';
import type { LastTimeBlockData } from './LastTimeBlock';
import type { ListBlockData } from './ListBlock';
import type { OikosListBlockData } from './OikosListBlock';
import type { ParagraphBlockData } from './ParagraphBlock';
import type { VideoEmbedBlockData } from './VideoEmbedBlock';

export type EditorBlockType =
  | 'paragraph'
  | 'header'
  | 'list'
  | 'oikosList'
  | 'videoEmbed'
  | 'biblePassage'
  | 'lastTime';

export type EditorBlockDataMap = {
  paragraph: ParagraphBlockData;
  header: HeaderBlockData;
  list: ListBlockData;
  oikosList: OikosListBlockData;
  videoEmbed: VideoEmbedBlockData;
  biblePassage: BiblePassageBlockData;
  lastTime: LastTimeBlockData;
};
