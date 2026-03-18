import type { API } from '@editorjs/editorjs';
import type { IWillBlockData } from 'src/types/content/IWillBlock';

export type IWillToolConfig = {
  instructionText?: string;
  labelText?: string;
};

export type IWillToolConstructorArgs = {
  api: API;
  config?: IWillToolConfig;
  data?: Partial<IWillBlockData>;
  readOnly?: boolean;
};
