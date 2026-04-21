import type { Component } from 'vue';

import ParagraphBlock from './blocks/ParagraphBlock.vue';
import HeaderBlock from './blocks/HeaderBlock.vue';
import ListBlock from './blocks/ListBlock.vue';
import OikosListBlock from './blocks/OikosListBlock.vue';
import VideoBlock from './blocks/VideoBlock.vue';
import BiblePassageBlock from './blocks/BiblePassageBlock.vue';
import LastTimeBlock from './blocks/LastTimeBlock.vue';
import SectionMarkerBlock from './blocks/SectionMarkerBlock.vue';
import NotesAreaBlock from './blocks/NotesAreaBlock.vue';
import IWillBlock from './blocks/IWillBlock.vue';

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

  if (type === 'video' || type === 'videoEmbed') {
    return VideoBlock;
  }

  if (type === 'biblePassage') {
    return BiblePassageBlock;
  }

  if (type === 'lastTime') {
    return LastTimeBlock;
  }

  if (type === 'sectionMarker') {
    return SectionMarkerBlock;
  }
  if (type === 'notesArea') {
    return NotesAreaBlock;
  }

  if (type === 'iWill') {
    return IWillBlock;
  }

  return null;
}
