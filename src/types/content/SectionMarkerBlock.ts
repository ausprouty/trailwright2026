export type SectionTheme = 'back' | 'up' | 'forward';

export type SectionMarkerBlockData = {
  theme: SectionTheme;
};

export const DEFAULT_SECTION_MARKER_BLOCK_DATA: SectionMarkerBlockData = {
  theme: 'back',
};
