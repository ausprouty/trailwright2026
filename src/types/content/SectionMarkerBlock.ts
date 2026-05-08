export type SectionTheme =
  | 'back'
  | 'up'
  | 'forward'
  | 'review'
  | 'challenge'
  | 'bible-study'
  | 'questions-practice'
  | 'bible-commentary';

export type SectionMarkerBlockData = {
  theme: SectionTheme;
  title?: string;
  icon?: string;
};

export const DEFAULT_SECTION_MARKER_BLOCK_DATA: SectionMarkerBlockData = {
  theme: 'back',
};
