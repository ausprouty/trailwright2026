import type { AnyEditorJsBlock, SectionTheme } from 'src/types/content/MigrationTypes';
import type { IconListItem } from 'src/types/content/IconListBlock';

type NotesTarget =
  | 'look-up'
  | 'look-forward'
  | 'review'
  | 'bible-study'
  | 'questions-practice'
  | 'bible-commentary';

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

    if (isSectionMarker(block, 'review')) {
      ensureNotesAreaBeforeSection(result, 'review', options.keyPrefix);
    }

    if (isSectionMarker(block, 'bible-study')) {
      ensureNotesAreaBeforeSection(result, 'bible-study', options.keyPrefix);
    }

    if (isSectionMarker(block, 'questions-practice')) {
      ensureNotesAreaBeforeSection(result, 'questions-practice', options.keyPrefix);
    }

    if (isSectionMarker(block, 'bible-commentary')) {
      ensureNotesAreaBeforeSection(result, 'bible-commentary', options.keyPrefix);
    }

    result.push(normalizeBlock(block));
  }

  replaceFirstLookForwardNotesWithIWill(result, options.keyPrefix);

  return result;
}

function buildIWillBlock(storageKey: string): AnyEditorJsBlock {
  return {
    type: 'iWill',
    data: {
      storageKey,
    },
  };
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

function getLessonListItems(block: AnyEditorJsBlock): IconListItem[] {
  const data = block.data as { items?: unknown[] };

  if (!Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item): IconListItem => {
    if (typeof item === 'string') {
      return {
        icon: 'application',
        text: item,
      };
    }

    if (item && typeof item === 'object') {
      const value = item as { icon?: unknown; text?: unknown };

      return {
        icon: typeof value.icon === 'string' ? value.icon : 'application',
        text: typeof value.text === 'string' ? value.text : '',
      };
    }

    return {
      icon: 'application',
      text: '',
    };
  });
}

function isLessonListBlock(block: AnyEditorJsBlock): boolean {
  if (block.type !== 'list') {
    return false;
  }

  const data = block.data as { variant?: string };
  return data.variant === 'lesson-list';
}

function isSectionMarker(block: AnyEditorJsBlock, theme: SectionTheme): boolean {
  if (block.type !== 'sectionMarker') {
    return false;
  }

  const data = block.data as { theme?: SectionTheme };
  return data.theme === theme;
}

function normalizeBlock(block: AnyEditorJsBlock): AnyEditorJsBlock {
  if (isLessonListBlock(block)) {
    return {
      type: 'iconList',
      data: {
        items: getLessonListItems(block),
      },
    };
  }

  return block;
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
