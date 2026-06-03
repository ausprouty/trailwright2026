import type { AnyEditorJsBlock, SectionTheme } from 'src/types/content/MigrationTypes';
import type { IconListItem } from 'src/types/content/IconListBlock';
import { buildCollapsibleGroupBlock } from './migrateOldLessonHtml';
type NotesTarget =
  | 'bible-commentary'
  | 'bible-study'
  | 'challenge'
  | 'discover'
  | 'look-up'
  | 'look-forward'
  | 'questions-practice'
  | 'sharing-life'
  | 'review';

type NormalizeLessonBlocksOptions = {
  keyPrefix: string;
};

function addIWillAfterFinalChallengeList(blocks: AnyEditorJsBlock[], keyPrefix: string): void {
  let lastChallengeIndex = -1;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (!block) {
      continue;
    }

    if (isChallengeSectionMarker(block)) {
      lastChallengeIndex = i;
    }
  }

  if (lastChallengeIndex === -1) {
    return;
  }

  for (let i = lastChallengeIndex + 1; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (!block) {
      continue;
    }

    if (block.type === 'sectionMarker') {
      return;
    }

    if (block.type !== 'list' && block.type !== 'iconList') {
      continue;
    }

    const nextBlock = blocks[i + 1];

    if (nextBlock && nextBlock.type === 'iWill') {
      return;
    }

    blocks.splice(i + 1, 0, buildIWillBlock(`${keyPrefix}-i-will`));
    return;
  }
}

function buildBackgroundCollapsibleBlock(
  title: string,
  blocks: AnyEditorJsBlock[],
): AnyEditorJsBlock {
  return buildCollapsibleGroupBlock(title, blocks);
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
  if (previousSectionHasNotesArea(blocks)) {
    return;
  }

  blocks.push(buildNotesAreaBlock(target, keyPrefix));
}

function previousSectionHasNotesArea(blocks: AnyEditorJsBlock[]): boolean {
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];

    if (!block) {
      continue;
    }

    if (block.type === 'sectionMarker') {
      return false;
    }

    if (block.type === 'notesArea') {
      return true;
    }
  }

  return false;
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

function getSectionMarkerTitle(block: AnyEditorJsBlock): string {
  const data = block.data as { title?: unknown };

  if (typeof data.title === 'string' && data.title.trim() !== '') {
    return data.title.trim();
  }

  return 'Notes';
}

function isBackgroundSectionMarker(block: AnyEditorJsBlock): boolean {
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
    theme === 'background' || title === 'background' || title === 'notas' || icon === 'background'
  );
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

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (!block) {
      continue;
    }

    if (isBackgroundSectionMarker(block)) {
      const title = getSectionMarkerTitle(block);
      const backgroundBlocks: AnyEditorJsBlock[] = [];

      for (let j = i + 1; j < blocks.length; j += 1) {
        const nextBlock = blocks[j];

        if (!nextBlock) {
          continue;
        }

        if (nextBlock.type === 'sectionMarker') {
          break;
        }

        backgroundBlocks.push(normalizeBlock(nextBlock));
        i = j;
      }

      result.push(buildBackgroundCollapsibleBlock(title, backgroundBlocks));
      continue;
    }

    if (isSectionMarker(block, 'bible-commentary')) {
      ensureNotesAreaBeforeSection(result, 'bible-commentary', options.keyPrefix);
    }

    if (isSectionMarker(block, 'bible-study')) {
      ensureNotesAreaBeforeSection(result, 'bible-study', options.keyPrefix);
    }

    if (isSectionMarker(block, 'challenge')) {
      ensureNotesAreaBeforeSection(result, 'challenge', options.keyPrefix);
    }

    if (isSectionMarker(block, 'forward')) {
      ensureNotesAreaBeforeSection(result, 'look-forward', options.keyPrefix);
    }

    if (isSectionMarker(block, 'questions-practice')) {
      ensureNotesAreaBeforeSection(result, 'questions-practice', options.keyPrefix);
    }

    if (isSectionMarker(block, 'review')) {
      ensureNotesAreaBeforeSection(result, 'review', options.keyPrefix);
    }

    if (isSectionMarker(block, 'up')) {
      ensureNotesAreaBeforeSection(result, 'look-up', options.keyPrefix);
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

  if (previousBlock.type !== 'list' && previousBlock.type !== 'iconList') {
    return;
  }

  blocks[lastIndex] = buildIWillBlock(`${keyPrefix}-i-will`);
}
