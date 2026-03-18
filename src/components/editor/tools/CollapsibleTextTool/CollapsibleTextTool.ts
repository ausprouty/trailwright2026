import '../shared/blockHeader.css';
import './CollapsibleTextTool.css';
import { icons } from 'src/components/editor/icons';

import type { API } from '@editorjs/editorjs';

import {
  DEFAULT_COLLAPSIBLE_TEXT_BLOCK_DATA,
  type CollapsibleTextBlockData,
} from 'src/types/content/CollapsibleTextBlock';

import type { CollapsibleTextToolConstructorArgs } from './types';

export default class CollapsibleTextTool {
  private api: API;
  private data: CollapsibleTextBlockData;
  private readOnly: boolean;

  private container: HTMLDivElement | null = null;
  private bodyInput: HTMLTextAreaElement | null = null;
  private headingInput: HTMLInputElement | null = null;
  private toggleButton: HTMLButtonElement | null = null;

  public static get toolbox() {
    return {
      title: 'Collapsible Text',
      icon: icons.collapsibleText,
    };
  }

  constructor({ api, data, readOnly }: CollapsibleTextToolConstructorArgs) {
    this.api = api;

    this.data = {
      ...DEFAULT_COLLAPSIBLE_TEXT_BLOCK_DATA,
      ...data,
    };

    this.readOnly = !!readOnly;
  }

  render(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'collapsible-text';

    // Heading
    this.headingInput = document.createElement('input');
    this.headingInput.type = 'text';
    this.headingInput.placeholder = 'Heading';
    this.headingInput.value = this.data.heading;
    this.headingInput.className = 'collapsible-text__heading';

    // Toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.type = 'button';
    this.toggleButton.textContent = this.data.isOpen ? '▼' : '▶';
    this.toggleButton.className = 'collapsible-text__toggle';

    // Body
    this.bodyInput = document.createElement('textarea');
    this.bodyInput.value = this.data.body;
    this.bodyInput.className = 'collapsible-text__body';

    if (!this.data.isOpen) {
      this.bodyInput.style.display = 'none';
    }

    if (!this.readOnly) {
      this.headingInput.addEventListener('input', () => {
        this.data.heading = this.headingInput!.value;
      });

      this.bodyInput.addEventListener('input', () => {
        this.data.body = this.bodyInput!.value;
      });

      this.toggleButton.addEventListener('click', () => {
        this.data.isOpen = !this.data.isOpen;

        if (this.bodyInput) {
          this.bodyInput.style.display = this.data.isOpen ? 'block' : 'none';
        }

        if (this.toggleButton) {
          this.toggleButton.textContent = this.data.isOpen ? '▼' : '▶';
        }
      });
    } else {
      this.headingInput.disabled = true;
      this.bodyInput.disabled = true;
      this.toggleButton.disabled = true;
    }

    const headerRow = document.createElement('div');
    headerRow.className = 'collapsible-text__header';

    headerRow.appendChild(this.toggleButton);
    headerRow.appendChild(this.headingInput);

    this.container.appendChild(headerRow);
    this.container.appendChild(this.bodyInput);

    return this.container;
  }

  save(): CollapsibleTextBlockData {
    return this.data;
  }
}
