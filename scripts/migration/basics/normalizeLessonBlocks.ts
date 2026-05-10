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

function addIWillAfterFinalChallengeList(blocks: AnyEditorJsBlock[], keyPrefix: string): void {
  if (blocks.length < 2) {
    return;
  }

  const lastBlock = blocks[blocks.length - 1];

  if (!lastBlock) {
    return;
  }

  if (lastBlock.type === 'iWill') {
    return;
  }

  if (lastBlock.type !== 'list') {
    return;
  }

  const previousBlock = blocks[blocks.length - 2];

  if (!previousBlock || !isChallengeSectionMarker(previousBlock)) {
    return;
  }

  blocks.push(buildIWillBlock(`${keyPrefix}-i-will`));
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
function isChallengeSectionMarker(block: AnyEditorJsBlock): boolean {
  if (block.type !== 'sectionMarker') {
    return false;
  }

  const data = block.data as {
    theme?: unknown;
    title?: unknown;
    icon?: unknown;
  };

  const theme = typeof data.theme === 'string' ? data.theme.toLowerCase() : '';

  const title = typeof data.title === 'string' ? data.title.toLowerCase() : '';

  const icon = typeof data.icon === 'string' ? data.icon.toLowerCase() : '';

  return (
    theme === 'challenge' ||
    theme === 'challenges' ||
    title === 'challenge' ||
    title === 'challenges' ||
    icon === 'challenges'
  );
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

  replaceFinalForwardNotesWithIWill(result, options.keyPrefix);
  replaceFinalNotesAreaWithIWill(result, options.keyPrefix);
  addIWillAfterFinalChallengeList(result, options.keyPrefix);
  return result;
}

function replaceFinalForwardNotesWithIWill(blocks: AnyEditorJsBlock[], keyPrefix: string): void {
  let lastForwardIndex = -1;
  let lastNotesAreaIndex = -1;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (!block) {
      continue;
    }

    if (isSectionMarker(block, 'forward')) {
      lastForwardIndex = i;
      lastNotesAreaIndex = -1;
      continue;
    }

    if (lastForwardIndex === -1) {
      continue;
    }

    if (block.type === 'notesArea') {
      lastNotesAreaIndex = i;
    }
  }

  if (lastForwardIndex === -1 || lastNotesAreaIndex === -1) {
    return;
  }

  blocks[lastNotesAreaIndex] = buildIWillBlock(`${keyPrefix}-i-will`);
}

function replaceFinalNotesAreaWithIWill(blocks: AnyEditorJsBlock[], keyPrefix: string): void {
  if (blocks.length < 2) {
    return;
  }

  const lastIndex = blocks.length - 1;
  const lastBlock = blocks[lastIndex];
  const previousBlock = blocks[lastIndex - 1];

  if (!lastBlock || !previousBlock) {
    return;
  }

  if (lastBlock.type !== 'notesArea') {
    return;
  }

  if (previousBlock.type !== 'list') {
    return;
  }

  blocks[lastIndex] = buildIWillBlock(`${keyPrefix}-i-will`);
}
