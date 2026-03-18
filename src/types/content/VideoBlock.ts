export type VideoSource = 'arclight' | 'youtube' | 'vimeo' | '';

export type VideoBlockData = {
  title: string;
  url: string;
  source: VideoSource;
  refId: string;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  isEditing: boolean;
};

export const DEFAULT_VIDEO_BLOCK_DATA: VideoBlockData = {
  title: '',
  url: '',
  source: '',
  refId: '',
  startTime: '',
  endTime: '',
  isOpen: true,
  isEditing: true,
};
