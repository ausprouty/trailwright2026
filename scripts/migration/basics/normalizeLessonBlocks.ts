import type { AnyEditorJsBlock, SectionTheme } from 'src/types/content/MigrationTypes';

type NotesTarget = 'look-up' | 'look-forward';

type NormalizeLessonBlocksOptions = {
  keyPrefix: string;
};

export function normalizeLessonBlocks(
  blocks: AnyEditorJsBlock[],
  options: NormalizeLessonBlocksOptions,
): AnyEditorJsBlock[] {
  const result: AnyEditorJsBlock[] = [];

  for (const block of blocks) {
    if (isSectionMarker(block, 'up')) {
      ensureNotesAreaBeforeSection(result, 'look-up', options.keyPrefix);
    }

    if (isSectionMarker(block, 'forward')) {
      ensureNotesAreaBeforeSection(result, 'look-forward', options.keyPrefix);
    }

    result.push(block);
  }

  replaceFirstLookForwardNotesWithIWill(result, options.keyPrefix);

  return result;
}

function ensureNotesAreaBeforeSection(
  blocks: AnyEditorJsBlock[],
  target: NotesTarget,
  keyPrefix: string,
): void {
  const nearbyNotes = findNearbyNotesArea(blocks, 3);

  if (nearbyNotes) {
    return;
  }

  blocks.push(buildNotesAreaBlock(target, keyPrefix));
}


function replaceFirstLookForwardNotesWithIWill(
  blocks: AnyEditorJsBlock[],
  keyPrefix: string,
): void {
  let inLookForward = false;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (!block) {
      continue;
    }

    if (isSectionMarker(block, 'forward')) {
      inLookForward = true;
      continue;
    }

    if (!inLookForward) {
      continue;
    }

    if (block.type === 'sectionMarker') {
      return;
    }

    if (block.type === 'notesArea') {
      blocks[i] = buildIWillBlock(`${keyPrefix}-i-will`);
      return;
    }
  }
}



function isSectionMarker(block: AnyEditorJsBlock, theme: SectionTheme): boolean {
  if (block.type !== 'sectionMarker') {
    return false;
  }

  const data = block.data as { theme?: SectionTheme };
  return data.theme === theme;
}

function findNearbyNotesArea(
  blocks: AnyEditorJsBlock[],
  distance: number,
): AnyEditorJsBlock | null {
  const start = Math.max(0, blocks.length - distance);

  for (let i = blocks.length - 1; i >= start; i -= 1) {
    const block = blocks[i];

    if (!block) {
      continue;
    }

    if (block.type === 'notesArea') {
      return block;
    }
  }

  return null;
}

function getTrailingMeaningfulBlocks(
  blocks: AnyEditorJsBlock[],
  distance: number,
): AnyEditorJsBlock[] {
  return blocks.filter((block) => !isIgnorableBlock(block)).slice(-distance);
}

function isIgnorableBlock(block: AnyEditorJsBlock): boolean {
  if (block.type !== 'paragraph') {
    return false;
  }

  const data = block.data as { text?: string };
  const text = typeof data.text === 'string' ? stripHtml(data.text).trim() : '';

  return text === '';
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, ' ');
}

function buildNotesAreaBlock(target: NotesTarget, keyPrefix: string): AnyEditorJsBlock {
  return {
    type: 'notesArea',
    data: {
      notes: '',
      storageKey: `${keyPrefix}-${target}`,
    },
  };
}

function buildIWillBlock(storageKey: string): AnyEditorJsBlock {
  return {
    type: 'iWill',
    data: {
      storageKey,
    },
  };
}
