import './TextAreaTool.css';

import EditorJS, { type OutputData } from '@editorjs/editorjs';

import {
  DEFAULT_TEXT_AREA_BLOCK_DATA,
  type TextAreaBlockData,
} from 'src/types/content/TextAreaBlock';
import { icons } from 'src/components/editor/icons';

import type { TextAreaToolConfig, TextAreaToolConstructorArgs } from './types';

export default class TextAreaTool {
  private api: {
    isReady: Promise<void>;
    save: () => Promise<OutputData>;
    destroy?: () => void;
  } | null = null;

  private data: TextAreaBlockData;
  private readOnly: boolean;
  private config: TextAreaToolConfig;

  private wrapper!: HTMLDivElement;
  private editorHolder!: HTMLDivElement;

  public static get toolbox() {
    return {
      title: 'Text Area',
      icon: icons.textArea,
    };
  }

  public static get isReadOnlySupported(): boolean {
    return true;
  }

  constructor({ data, config, readOnly }: TextAreaToolConstructorArgs = {}) {
    this.readOnly = readOnly ?? false;
    this.config = config ?? { tools: {} };

    this.data = {
      content: data?.content ?? DEFAULT_TEXT_AREA_BLOCK_DATA.content,
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'text-area-tool';

    this.editorHolder = document.createElement('div');
    this.editorHolder.className = 'text-area-tool__editor-holder';

    this.editorHolder.addEventListener('keydown', (event) => {
      event.stopPropagation();
    });

    this.editorHolder.addEventListener('keyup', (event) => {
      event.stopPropagation();
    });

    this.editorHolder.addEventListener('keypress', (event) => {
      event.stopPropagation();
    });

    this.wrapper.appendChild(this.editorHolder);

    void this.createNestedEditor();

    return this.wrapper;
  }

  private async createNestedEditor(): Promise<void> {
    this.api = new EditorJS({
      holder: this.editorHolder,
      readOnly: this.readOnly,
      tools: this.config.tools,
      data: this.data.content,
      minHeight: 80,
    });

    await this.api.isReady;
  }

  public async save(): Promise<TextAreaBlockData> {
    let content: OutputData = {
      time: Date.now(),
      blocks: [],
    };

    if (this.api) {
      content = await this.api.save();
    }

    return {
      content,
    };
  }

  public destroy(): void {
    if (this.api && typeof this.api.destroy === 'function') {
      this.api.destroy();
      this.api = null;
    }
  }

  public validate(savedData: TextAreaBlockData): boolean {
    return Array.isArray(savedData.content.blocks);
  }
}
