import type { API } from '@editorjs/editorjs';
import type { VideoBlockData } from 'src/types/content/VideoBlock';

export type VideoToolLabels = {
  doneLabel?: string;
  editLabel?: string;
  endLabel?: string;
  previewUnavailable?: string;
  startLabel?: string;
  titleLabel?: string;
  untitledVideo?: string;
  urlLabel?: string;
  watchOnlineTemplate?: string;
};

export type VideoToolConfig = {
  labels?: VideoToolLabels;
};

export type VideoToolConstructorArgs = {
  api: API;
  config?: VideoToolConfig;
  data?: Partial<VideoBlockData>;
  readOnly?: boolean;
};
