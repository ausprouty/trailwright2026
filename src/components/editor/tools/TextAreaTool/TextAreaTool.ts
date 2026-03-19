import './TextAreaTool.css';
import { icons } from 'src/components/editor/icons';

import {
  DEFAULT_TEXT_AREA_BLOCK_DATA,
  type TextAreaBlockData,
} from 'src/types/content/TextAreaBlock';

type TextAreaToolConstructorArgs = {
  data?: Partial<TextAreaBlockData>;
  readOnly?: boolean;
};

export default class TextAreaTool {
  private data: TextAreaBlockData;
  private readOnly: boolean;
  private wrapper: HTMLDivElement | null;

  public static get toolbox() {
    return {
      title: 'Text Area',
      icon: icons.textArea,
    };
  }

  constructor({ data, readOnly }: TextAreaToolConstructorArgs = {}) {
    this.data = {
      ...DEFAULT_TEXT_AREA_BLOCK_DATA,
      ...(data ?? {}),
    };
    this.readOnly = !!readOnly;
    this.wrapper = null;
  }

  public render(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'text-area-tool';

    if (this.readOnly) {
      const content = document.createElement('div');
      content.className = 'text-area-tool__read';
      content.textContent = this.data.text;
      wrapper.appendChild(content);
    } else {
      const textarea = document.createElement('textarea');
      textarea.className = 'text-area-tool__input';
      textarea.value = this.data.text;
      textarea.placeholder = 'Type here...';
      textarea.rows = 6;

      textarea.addEventListener('input', () => {
        this.data.text = textarea.value;
      });

      wrapper.appendChild(textarea);
    }

    this.wrapper = wrapper;
    return wrapper;
  }

  public save(): TextAreaBlockData {
    return {
      text: this.data.text,
    };
  }
}
