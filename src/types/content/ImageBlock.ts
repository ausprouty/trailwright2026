export type ImageBlockData = {
  file: {
    url: string;
  };
  caption: string;
  withBorder: boolean;
  withBackground: boolean;
  stretched: boolean;
};

export const DEFAULT_IMAGE_BLOCK_DATA: ImageBlockData = {
  file: {
    url: '',
  },
  caption: '',
  withBorder: false,
  withBackground: false,
  stretched: false,
};
