import '../shared/blockHeader.css';
import './BiblePassageTool.css';

import { fetchBiblePassage, type BibleToolConfig } from '../shared/bibleApi';
import { escapeHtml } from '../shared/html';

type BiblePassageToolData = {
  reference: string;
  passage: string;
  isOpen?: boolean;
};

type EditorJSToolConstructorArgs = {
  data: Partial<BiblePassageToolData>;
  api: unknown;
  config?: BibleToolConfig;
  readOnly?: boolean;
};

export default class BiblePassageTool {
  public static get toolbox() {
    return {
      title: 'Bible Passage',
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3h9a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2zm0 2v12h10V6a1 1 0 0 0-1-1H6zm2 3h6v2H8V8zm0 4h6v2H8v-2z"/>
        </svg>
      `,
    };
  }

  public static get isReadOnlySupported() {
    return true;
  }

  public static get sanitize() {
    return {
      reference: {},
      passage: {
        br: true,
        p: true,
        div: {
          class: true,
        },
        sup: {
          class: true,
        },
      },
      isOpen: {},
    };
  }

  private readonly readOnly: boolean;
  private isEditing = false;
  private readonly config: BibleToolConfig;

  private data: BiblePassageToolData;

  private wrapper: HTMLDivElement | null = null;
  private controlsEl: HTMLDivElement | null = null;
  private referenceInput: HTMLInputElement | null = null;
  private fetchButton: HTMLButtonElement | null = null;
  private statusEl: HTMLDivElement | null = null;
  private headerEl: HTMLButtonElement | null = null;
  private passageEl: HTMLDivElement | null = null;

  public constructor(args: EditorJSToolConstructorArgs) {
    this.readOnly = Boolean(args.readOnly);
    this.config = args.config || {};
    this.data = {
      reference: args.data?.reference ? String(args.data.reference) : '',
      passage: args.data?.passage ? String(args.data.passage) : '',
      isOpen: typeof args.data?.isOpen === 'boolean' ? args.data.isOpen : true,
    };

    this.isEditing = !this.data.passage;
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'bible-passage-tool';

    this.controlsEl = document.createElement('div');
    this.controlsEl.className = 'bible-passage-tool__controls';

    this.referenceInput = document.createElement('input');
    this.referenceInput.type = 'text';
    this.referenceInput.placeholder = 'Enter Bible reference, e.g. John 3:16-17';
    this.referenceInput.value = this.data.reference;
    this.referenceInput.className = 'bible-passage-tool__input';
    this.referenceInput.disabled = this.readOnly;

    this.fetchButton = document.createElement('button');
    this.fetchButton.type = 'button';
    this.fetchButton.textContent = 'Fetch passage';
    this.fetchButton.className = 'bible-passage-tool__button';
    this.fetchButton.disabled = this.readOnly;

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'bible-passage-tool__status';

    this.headerEl = document.createElement('button');
    this.headerEl.type = 'button';
    this.headerEl.className = 'bible-passage-tool__header tool-header';
    this.headerEl.style.display = 'none';

    this.passageEl = document.createElement('div');
    this.passageEl.className = 'bible-passage-tool__passage';

    if (this.data.passage) {
      this.updateDisplay();
    }

    if (!this.readOnly) {
      this.fetchButton.addEventListener('click', () => {
        void this.fetchPassage();
      });

      this.referenceInput.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          void this.fetchPassage();
        }
      });

      this.headerEl.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target) {
          return;
        }

        if (target.closest('.bible-passage-tool__header-edit')) {
          event.preventDefault();
          event.stopPropagation();
          this.showControlsForEditing();
          return;
        }

        this.data.isOpen = !this.data.isOpen;
        this.syncOpenState();
      });
    }

    this.controlsEl.appendChild(this.referenceInput);
    this.controlsEl.appendChild(this.fetchButton);

    this.wrapper.appendChild(this.controlsEl);
    this.wrapper.appendChild(this.statusEl);
    this.wrapper.appendChild(this.headerEl);
    this.wrapper.appendChild(this.passageEl);

    this.syncOpenState();

    return this.wrapper;
  }

  private async fetchPassage(): Promise<void> {
    const reference = this.referenceInput
      ? this.referenceInput.value.trim()
      : this.data.reference.trim();

    if (!reference) {
      this.setStatus('Please enter a Bible reference.', 'error');
      return;
    }

    this.setLoading(true);
    this.setStatus('Loading passage...', 'info');

    try {
      const passageText = await fetchBiblePassage(reference, this.config);

      if (!passageText) {
        throw new Error('No passage text returned from API');
      }

      this.data.reference = reference;
      this.data.passage = passageText;
      this.data.isOpen = true;
      this.isEditing = false;

      this.updateDisplay();
      this.setStatus('Passage loaded.', 'success');
    } catch (err) {
      console.error('Bible passage fetch failed:', err);
      this.setStatus('Could not load passage. Check the reference and API response.', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  private showControlsForEditing(): void {
    this.isEditing = true;
    this.syncOpenState();

    if (this.statusEl) {
      this.statusEl.style.display = 'none';
    }

    if (this.referenceInput) {
      this.referenceInput.disabled = false;
      this.referenceInput.focus();
      this.referenceInput.select();
    }

    if (this.fetchButton) {
      this.fetchButton.disabled = false;
      this.fetchButton.textContent = 'Fetch passage';
    }
  }

  private updateDisplay(): void {
    if (this.headerEl) {
      this.headerEl.innerHTML = `
        <span class="tool-header__left">
          <span class="tool-header__icon tool-header__icon--text">✟</span>
          <span class="tool-header__text">
            Read ${escapeHtml(this.data.reference)}
          </span>
        </span>
        <span class="tool-header__right">
          <span class="tool-header__action bible-passage-tool__header-edit">
            Edit
          </span>
          <span class="tool-header__toggle bible-passage-tool__header-toggle">
            ${this.data.isOpen ? '−' : '+'}
          </span>
        </span>
      `;
      this.headerEl.style.display = 'flex';
    }

    if (this.passageEl) {
      this.passageEl.innerHTML = this.formatPassage(this.data.passage);
    }

    this.syncOpenState();
  }

  private syncOpenState(): void {
    if (!this.headerEl || !this.passageEl || !this.controlsEl) {
      return;
    }

    if (this.isEditing) {
      this.controlsEl.style.display = 'flex';
      this.passageEl.style.display = this.data.isOpen ? 'block' : 'none';
    } else {
      this.controlsEl.style.display = 'none';
      this.passageEl.style.display = this.data.isOpen ? 'block' : 'none';
    }

    this.headerEl.dataset.open = this.data.isOpen ? 'true' : 'false';

    const toggle = this.headerEl.querySelector('.bible-passage-tool__header-toggle');
    if (toggle) {
      toggle.textContent = this.data.isOpen ? '−' : '+';
    }
  }

  private formatPassage(text: string): string {
    return text;
  }

  public save(): BiblePassageToolData {
    const ref = this.referenceInput ? this.referenceInput.value.trim() : this.data.reference;

    return {
      reference: ref,
      passage: this.data.passage || '',
      isOpen: this.data.isOpen ?? false,
    };
  }

  public validate(savedData: BiblePassageToolData): boolean {
    return Boolean(savedData.reference && savedData.reference.trim());
  }

  private setLoading(isLoading: boolean): void {
    if (this.fetchButton) {
      this.fetchButton.disabled = isLoading || this.readOnly;
      this.fetchButton.textContent = isLoading ? 'Loading...' : 'Fetch passage';
    }

    if (this.referenceInput) {
      this.referenceInput.disabled = isLoading || this.readOnly;
    }
  }

  private setStatus(message: string, type: string): void {
    if (!this.statusEl) {
      return;
    }

    this.statusEl.textContent = message;
    this.statusEl.dataset.state = type;
    this.statusEl.style.display = message ? 'block' : 'none';
  }
}
