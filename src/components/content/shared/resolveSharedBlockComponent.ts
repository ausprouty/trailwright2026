import type { Component } from 'vue';

import ParagraphBlock from './blocks/ParagraphBlock.vue';
import HeaderBlock from './blocks/HeaderBlock.vue';
import ListBlock from './blocks/ListBlock.vue';
import OikosListBlock from './blocks/OikosListBlock.vue';
import VideoBlock from './blocks/VideoBlock.vue';
import BiblePassageBlock from './blocks/BiblePassageBlock.vue';
import LastTimeBlock from './blocks/LastTimeBlock.vue';

export function resolveSharedBlockComponent(type: string): Component | null {
  if (type === 'paragraph') {
    return ParagraphBlock;
  }

  if (type === 'header') {
    return HeaderBlock;
  }

  if (type === 'list') {
    return ListBlock;
  }

  if (type === 'oikosList') {
    return OikosListBlock;
  }

  if (type === 'videoEmbed') {
    return VideoBlock;
  }

  if (type === 'biblePassage') {
    return BiblePassageBlock;
  }

  if (type === 'lastTime') {
    return LastTimeBlock;
  }

  return null;
}
