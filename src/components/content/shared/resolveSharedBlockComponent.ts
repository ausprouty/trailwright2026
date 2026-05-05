import type { Component } from 'vue';

import BiblePassageBlock from './blocks/BiblePassageBlock.vue';
import CollapsibleGroupBlock from './blocks/CollapsibleGroupBlock.vue';
import HeaderBlock from './blocks/HeaderBlock.vue';
import IconListBlock from './blocks/IconListBlock.vue';
import IWillBlock from './blocks/IWillBlock.vue';
import LastTimeBlock from './blocks/LastTimeBlock.vue';
import ListBlock from './blocks/ListBlock.vue';
import NotesAreaBlock from './blocks/NotesAreaBlock.vue';
import OikosListBlock from './blocks/OikosListBlock.vue';
import ParagraphBlock from './blocks/ParagraphBlock.vue';
import SectionMarkerBlock from './blocks/SectionMarkerBlock.vue';
import VideoBlock from './blocks/VideoBlock.vue';

export function resolveSharedBlockComponent(type: string): Component | null {
  if (type === 'biblePassage') {
    return BiblePassageBlock;
  }

  if (type === 'collapsibleGroup') {
    return CollapsibleGroupBlock;
  }

  if (type === 'header') {
    return HeaderBlock;
  }

  if (type === 'iconList') {
    return IconListBlock;
  }

  if (type === 'iWill') {
    return IWillBlock;
  }

  if (type === 'lastTime') {
    return LastTimeBlock;
  }

  if (type === 'list') {
    return ListBlock;
  }

  if (type === 'notesArea') {
    return NotesAreaBlock;
  }

  if (type === 'oikosList') {
    return OikosListBlock;
  }

  if (type === 'paragraph') {
    return ParagraphBlock;
  }

  if (type === 'sectionMarker') {
    return SectionMarkerBlock;
  }

  if (type === 'video' || type === 'videoEmbed') {
    return VideoBlock;
  }

  return null;
}
