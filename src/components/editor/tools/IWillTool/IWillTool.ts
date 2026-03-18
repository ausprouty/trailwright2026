import './IWillTool.css';

import { DEFAULT_I_WILL_BLOCK_DATA, type IWillBlockData } from 'src/types/content/IWillBlock';

import type { IWillToolConstructorArgs } from './types';
import { icons } from 'src/components/editor/icons';

export default class IWillTool {
  private data: IWillBlockData;
  private readOnly: boolean;
  private wrapper!: HTMLDivElement;
  private textarea!: HTMLTextAreaElement;

  private instructionText: string;
  private labelText: string;
  private response: string;

  public constructor({ config, data, readOnly }: IWillToolConstructorArgs) {
    this.data = {
      ...DEFAULT_I_WILL_BLOCK_DATA,
      ...data,
    };

    this.readOnly = Boolean(readOnly);
    this.response = '';

    this.instructionText =
      config?.instructionText ??
      'Write your "I will_____ by_______ when" next step goals into this notetaking area.';

    this.labelText = config?.labelText ?? 'Notes:';
  }

  public static get toolbox() {
    return {
      title: 'I Will',
      icon: icons.iWill,
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
    this.textarea.value = this.response;
    this.textarea.rows = 5;
    this.textarea.placeholder = '';

    if (this.readOnly) {
      this.textarea.disabled = true;
    } else {
      this.textarea.addEventListener('input', () => {
        this.response = this.textarea.value;
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
    };
  }
}
