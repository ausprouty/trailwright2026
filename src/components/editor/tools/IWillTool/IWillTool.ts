import './IWillTool.css';

import { DEFAULT_I_WILL_BLOCK_DATA, type IWillBlockData } from 'src/types/content/IWillBlock';

import type { IWillToolConstructorArgs } from './types';

export default class IWillTool {
  private data: IWillBlockData;
  private readOnly: boolean;
  private wrapper!: HTMLDivElement;
  private textarea!: HTMLTextAreaElement;

  private instructionText: string;
  private labelText: string;

  public constructor({ config, data, readOnly }: IWillToolConstructorArgs) {
    this.data = {
      ...DEFAULT_I_WILL_BLOCK_DATA,
      ...data,
    };

    this.readOnly = !!readOnly;
    this.instructionText =
      config?.instructionText ??
      'Write your "I will_____ by_______ when" next step goals into this notetaking area.';
    this.labelText = config?.labelText ?? 'Notes:';
  }

  public static get toolbox() {
    return {
      title: 'I Will',
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 11.5 11 13.5 15 9.5"/>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/>
        </svg>
      `,
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'i-will-tool';

    const instruction = document.createElement('p');
    instruction.className = 'i-will-tool__instruction';
    instruction.textContent = this.instructionText;

    const label = document.createElement('label');
    label.className = 'i-will-tool__label';
    label.textContent = this.labelText;

    this.textarea = document.createElement('textarea');
    this.textarea.className = 'i-will-tool__textarea';
    this.textarea.value = this.data.response;
    this.textarea.rows = 5;
    this.textarea.placeholder = '';

    if (this.readOnly) {
      this.textarea.disabled = true;
    } else {
      this.textarea.addEventListener('input', () => {
        this.data.response = this.textarea.value;
      });
    }

    this.wrapper.appendChild(instruction);
    this.wrapper.appendChild(label);
    this.wrapper.appendChild(this.textarea);

    return this.wrapper;
  }

  public save(): IWillBlockData {
    return {
      ...this.data,
      response: this.textarea ? this.textarea.value : this.data.response,
    };
  }
}
