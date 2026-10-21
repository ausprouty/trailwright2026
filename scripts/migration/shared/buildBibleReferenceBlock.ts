import type { AnyEditorJsBlock } from 'src/types/content/EditorBlocks';
import { normalizeBibleReferenceHtml } from './normalizeBibleReferenceHtml';

type BibleReference = {
  id: string;
  marker: string;
  label: string;
  passage: string;
};

export function buildBibleReferenceBlock(
  html: string,
  references: BibleReference[],
): AnyEditorJsBlock {
  return {
    type: 'bibleReference',
    data: {
      text: normalizeBibleReferenceHtml(html),
      references,
      isOpen: false,
    },
  };
}
