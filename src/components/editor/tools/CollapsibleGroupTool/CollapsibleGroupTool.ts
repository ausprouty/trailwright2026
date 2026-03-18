import './CollapsibleGroupTool.css';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import type {
  CollapsibleGroupConfig,
  CollapsibleGroupData,
  CollapsibleGroupToolConstructorArgs,
} from './types';
import { icons } from 'src/components/editor/icons';

export default class CollapsibleGroupTool {
  private api: {
    isReady: Promise<void>;
    save: () => Promise<OutputData>;
    destroy?: () => void;
  } | null = null;
  private data: CollapsibleGroupData;
  private readOnly: boolean;
  private config: CollapsibleGroupConfig;

  private wrapper!: HTMLDivElement;
  private header!: HTMLButtonElement;
  private arrow!: HTMLSpanElement;
  private titleInput!: HTMLInputElement;
  private body!: HTMLDivElement;
  private editorHolder!: HTMLDivElement;

  export default class CollapsibleGroupTool {
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

    this.header = document.createElement('button');
    this.header.type = 'button';
    this.header.className = 'cg-tool__header';

    this.arrow = document.createElement('span');
    this.arrow.className = 'cg-tool__arrow';
    this.arrow.innerHTML = '&#9656;';

    this.titleInput = document.createElement('input');
    this.titleInput.type = 'text';
    this.titleInput.className = 'cg-tool__title';
    this.titleInput.placeholder = this.config.placeholder ?? 'Toggle heading';
    this.titleInput.value = this.data.title;
    this.titleInput.readOnly = this.readOnly;

    this.body = document.createElement('div');
    this.body.className = 'cg-tool__body';

    this.editorHolder = document.createElement('div');
    this.editorHolder.className = 'cg-tool__editor-holder';

    this.body.appendChild(this.editorHolder);
    this.header.appendChild(this.arrow);
    this.header.appendChild(this.titleInput);
    this.wrapper.appendChild(this.header);
    this.wrapper.appendChild(this.body);

    if (!this.readOnly) {
      this.header.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        if (target === this.titleInput) {
          return;
        }

        this.toggleOpen();
      });
    }

    this.applyOpenState();
    void this.createNestedEditor();

    return this.wrapper;
  }

  private toggleOpen(): void {
    this.data.isOpen = !this.data.isOpen;
    this.applyOpenState();
  }

  private applyOpenState(): void {
    if (this.data.isOpen) {
      this.wrapper.classList.add('cg-tool--open');
      this.body.style.display = 'block';
      this.arrow.style.transform = 'rotate(90deg)';
    } else {
      this.wrapper.classList.remove('cg-tool--open');
      this.body.style.display = 'none';
      this.arrow.style.transform = 'rotate(0deg)';
    }
  }

  private async createNestedEditor(): Promise<void> {
    this.api = new EditorJS({
      holder: this.editorHolder,
      readOnly: this.readOnly,
      tools: this.config.tools,
      data: this.data.content,
      minHeight: 40,
    });

    await this.api.isReady;
  }

  public async save(): Promise<CollapsibleGroupData> {
    let content: OutputData = {
      time: Date.now(),
      blocks: [],
    };

    if (this.api) {
      content = await this.api.save();
    }

    return {
      title: this.titleInput.value.trim(),
      isOpen: this.data.isOpen,
      content,
    };
  }

  public destroy(): void {
    if (this.api && typeof this.api.destroy === 'function') {
      this.api.destroy();
      this.api = null;
    }
  }

  public validate(savedData: CollapsibleGroupData): boolean {
    return savedData.title.trim().length > 0;
  }
}
