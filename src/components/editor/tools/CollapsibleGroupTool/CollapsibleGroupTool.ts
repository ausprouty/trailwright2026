import './CollapsibleGroupTool.css';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import type {
  CollapsibleGroupConfig,
  CollapsibleGroupData,
  CollapsibleGroupToolConstructorArgs,
} from './types';
import { icons } from 'src/components/editor/icons';

import {
  createNestedToolPanel,
  DEFAULT_NESTED_TOOL_PANEL_ITEMS,
} from 'src/components/editor/tools/CreateNestedToolPanel/CreateNestedToolPanel';

export default class CollapsibleGroupTool {
  private nestedEditor: EditorJS | null = null;
  private toolPanel: HTMLElement | null = null;
  private data: CollapsibleGroupData;
  private readOnly: boolean;
  private config: CollapsibleGroupConfig;
  private isEditing = false;
  private wrapper!: HTMLDivElement;
  private header!: HTMLDivElement;
  private headerMain!: HTMLDivElement;
  private actions!: HTMLDivElement;
  private editButton!: HTMLButtonElement;
  private addButton!: HTMLButtonElement;
  private titleInput!: HTMLInputElement;
  private body!: HTMLDivElement;
  private editorFrame!: HTMLDivElement;
  private editorHolder!: HTMLDivElement;

  public static get toolbox() {
    return {
      title: 'Collapsible Group',
      icon: icons.collapsibleGroup,
    };
  }

  public static get isReadOnlySupported(): boolean {
    return true;
  }

  constructor({ data, config, readOnly }: CollapsibleGroupToolConstructorArgs) {
    this.readOnly = readOnly ?? false;
    this.config = config ?? { tools: {} };

    this.data = {
      title: data?.title ?? '',
      isOpen: data?.isOpen ?? true,
      content: data?.content ?? {
        time: Date.now(),
        blocks: [
          {
            type: 'paragraph',
            data: {
              text: '',
            },
          },
        ],
      },
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'cg-tool';

    this.header = document.createElement('div');
    this.header.className = 'cg-tool__header';

    this.headerMain = document.createElement('div');
    this.headerMain.className = 'cg-tool__header-main';

    this.actions = document.createElement('div');
    this.actions.className = 'cg-tool__actions';

    this.titleInput = document.createElement('input');
    this.titleInput.type = 'text';
    this.titleInput.className = 'cg-tool__title';
    this.titleInput.placeholder = this.config.placeholder ?? 'Toggle heading';
    this.titleInput.value = this.data.title;
    this.titleInput.readOnly = this.readOnly;

    this.editButton = document.createElement('button');
    this.editButton.type = 'button';
    this.editButton.className = 'cg-tool__edit-btn';
    this.editButton.textContent = 'Edit';

    this.addButton = document.createElement('button');
    this.addButton.type = 'button';
    this.addButton.className = 'cg-tool__action-btn';
    this.addButton.innerHTML = '+';
    this.addButton.setAttribute('aria-label', 'Add block');

    this.body = document.createElement('div');
    this.body.className = 'cg-tool__body';

    this.editorFrame = document.createElement('div');
    this.editorFrame.className = 'cg-tool__editor-frame';

    this.editorHolder = document.createElement('div');
    this.editorHolder.className = 'cg-tool__editor-holder';

    this.editorHolder.addEventListener('keydown', (event) => {
      event.stopPropagation();
    });

    this.editorHolder.addEventListener('keyup', (event) => {
      event.stopPropagation();
    });

    this.editorHolder.addEventListener('keypress', (event) => {
      event.stopPropagation();
    });

    if (!this.readOnly) {
      this.editButton.addEventListener('click', () => {
        this.isEditing = true;
        this.data.isOpen = true;
        this.applyEditingState();
        this.applyOpenState();
        this.titleInput.focus();
        this.titleInput.select();
      });

      this.addButton.addEventListener('click', () => {
        if (this.isEditing) {
          this.isEditing = false;
          this.data.isOpen = false;
          this.applyEditingState();
          this.applyOpenState();
          return;
        }

        this.isEditing = true;
        this.data.isOpen = true;
        this.applyEditingState();
        this.applyOpenState();
      });

      this.toolPanel = createNestedToolPanel(DEFAULT_NESTED_TOOL_PANEL_ITEMS, {
        editorGetter: () => this.nestedEditor,
        onInsert: () => {
          this.isEditing = true;
          this.data.isOpen = true;
          this.applyEditingState();
          this.applyOpenState();
        },
        title: 'Edit Block',
      });
    } else {
      this.editButton.style.display = 'none';
      this.addButton.style.display = 'none';
    }

    this.editorFrame.appendChild(this.editorHolder);

    if (this.toolPanel) {
      this.editorFrame.appendChild(this.toolPanel);
    }

    this.body.appendChild(this.editorFrame);

    this.headerMain.appendChild(this.titleInput);
    this.actions.appendChild(this.editButton);
    this.actions.appendChild(this.addButton);

    this.header.appendChild(this.headerMain);
    this.header.appendChild(this.actions);

    this.wrapper.appendChild(this.header);
    this.wrapper.appendChild(this.body);

    this.applyOpenState();

    if (!this.readOnly && !this.data.title.trim()) {
      this.isEditing = true;
      this.applyEditingState();
    } else {
      this.applyEditingState();
    }

    void this.createNestedEditor();

    return this.wrapper;
  }

  private applyOpenState(): void {
    if (this.data.isOpen) {
      this.wrapper.classList.add('cg-tool--open');
      this.wrapper.classList.remove('cg-tool--collapsed');
      this.body.style.display = 'block';
    } else {
      this.wrapper.classList.remove('cg-tool--open');
      this.wrapper.classList.add('cg-tool--collapsed');
      this.body.style.display = 'none';
    }
  }

  private applyEditingState(): void {
    if (this.readOnly) {
      return;
    }

    if (this.isEditing) {
      this.wrapper.classList.add('cg-tool--editing');
      this.editButton.style.display = 'none';
      this.addButton.textContent = '-';
      this.addButton.setAttribute('aria-label', 'Finish editing');
      this.data.isOpen = true;
      this.applyOpenState();

      if (this.toolPanel) {
        this.toolPanel.style.display = '';
      }
    } else {
      this.wrapper.classList.remove('cg-tool--editing');
      this.editButton.style.display = '';
      this.addButton.textContent = '+';
      this.addButton.setAttribute('aria-label', 'Edit content');

      if (this.toolPanel) {
        this.toolPanel.style.display = 'none';
      }
    }
  }

  private async createNestedEditor(): Promise<void> {
    this.nestedEditor = new EditorJS({
      holder: this.editorHolder,
      readOnly: this.readOnly,
      tools: this.config.tools,
      data: this.data.content,
      minHeight: 120,
    });

    await this.nestedEditor.isReady;
  }

  public async save(): Promise<CollapsibleGroupData> {
    let content: OutputData = {
      time: Date.now(),
      blocks: [],
    };

    if (this.nestedEditor) {
      await this.nestedEditor.isReady;
      content = await this.nestedEditor.save();
    }

    return {
      title: this.titleInput.value.trim(),
      isOpen: this.data.isOpen,
      content,
    };
  }

  public destroy(): void {
    if (this.nestedEditor && typeof this.nestedEditor.destroy === 'function') {
      this.nestedEditor.destroy();
      this.nestedEditor = null;
    }
  }

  public validate(savedData: CollapsibleGroupData): boolean {
    return savedData.title.trim().length > 0;
  }
}
