import '../shared/blockHeader.css';
import './BiblePassageTool.css';
import { icons } from 'src/components/editor/icons';
import type {
  BiblePassageBlockData,
  BiblePassageToolConfig,
} from 'src/types/content/BiblePassageBlock';

import { fetchBiblePassage, type BibleToolConfig } from '../shared/fetchBiblePassage';
import { escapeHtml } from '../shared/html';

type EditorJSToolConstructorArgs = {
  data: Partial<BiblePassageBlockData>;
  api: unknown;
  config?: BiblePassageToolConfig;
  readOnly?: boolean;
};
export default class BiblePassageTool {
  public static get toolbox() {
    return {
      title: 'Bible Passage',
      icon: icons.biblePassage,
    };
  }

  public static get isReadOnlySupported() {
    return true;
  }

  public static get sanitize() {
    return {
      reference: {},
      html: {
        br: true,
        p: true,
        div: {
          class: true,
        },
        sup: {
          class: true,
        },
        url: {},
      },
      isOpen: {},
    };
  }

  private readonly readOnly: boolean;
  private isEditing = false;
  private readonly config: BibleToolConfig;

  private data: BiblePassageBlockData;

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
      html: args.data?.html ? String(args.data.html) : '',
      url: args.data?.url ? String(args.data.url) : '',
      isOpen: typeof args.data?.isOpen === 'boolean' ? args.data.isOpen : true,
    };

    this.isEditing = !this.data.html;
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

    if (this.data.html) {
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
      this.data.reference = '';
      this.data.html = '';
      this.data.isOpen = false;
      this.isEditing = true;
      this.updateDisplay();
      this.setStatus('Please enter a Bible reference.', 'error');
      return;
    }
    if (!this.isValidReference(reference)) {
      this.data.reference = reference;
      this.data.html = '';
      this.data.isOpen = false;
      this.isEditing = true;
      this.updateDisplay();
      this.setStatus(
        'Please enter a reference with chapter and verse, for example John 3:16.',
        'error',
      );
      return;
    }

    this.setLoading(true);
    this.setStatus('Loading passage...', 'info');

    try {
      const result = await fetchBiblePassage(reference, this.config);

      if (!result || !result.html) {
        this.data.reference = reference;
        this.data.html = '';
        this.data.url = '';
        this.data.isOpen = false;
        this.isEditing = true;
        this.updateDisplay();
        this.setStatus('Could not load passage. Check the reference and try again.', 'error');
        return;
      }

      this.data.reference = reference;
      this.data.html = result.html;
      this.data.url = result.url || '';
      this.data.isOpen = true;
      this.isEditing = false;
      this.updateDisplay();
      this.setStatus('', '');
    } catch (err) {
      this.data.reference = reference;
      this.data.html = '';
      this.data.isOpen = false;
      this.isEditing = true;
      this.updateDisplay();

      const message =
        err instanceof Error
          ? err.message
          : 'Could not load passage. Check the reference and try again.';

      this.setStatus(message, 'error');
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
    const hasPassage = Boolean(this.data.html && this.data.html.trim());

    if (this.headerEl) {
      if (hasPassage) {
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
      } else {
        this.headerEl.innerHTML = '';
        this.headerEl.style.display = 'none';
      }
    }

    if (this.passageEl) {
      this.passageEl.innerHTML = hasPassage ? this.formatPassage(this.data.html) : '';
    }

    this.syncOpenState();
  }

  private syncOpenState(): void {
    if (!this.headerEl || !this.passageEl || !this.controlsEl) {
      return;
    }

    const hasPassage = Boolean(this.data.html && this.data.html.trim());

    this.controlsEl.style.display = this.isEditing ? 'flex' : 'none';
    this.headerEl.style.display = !this.isEditing && hasPassage ? 'flex' : 'none';
    this.passageEl.style.display = hasPassage && this.data.isOpen ? 'block' : 'none';

    this.headerEl.dataset.open = this.data.isOpen ? 'true' : 'false';

    const toggle = this.headerEl.querySelector('.bible-passage-tool__header-toggle');

    if (toggle) {
      toggle.textContent = this.data.isOpen ? '−' : '+';
    }
  }
  private formatPassage(html: string): string {
    const readMore = this.data.url
      ? `
      <div class="bible-passage-tool__read-more-wrap">
        <a
          class="bible-passage-tool__read-more"
          href="${escapeHtml(this.data.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read More
        </a>
      </div>
    `
      : '';

    return `${html}${readMore}`;
  }

  private isValidReference(reference: string): boolean {
    const normalized = reference.trim();

    return /^[1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:-\d+)?$/i.test(normalized);
  }

  public save(): BiblePassageBlockData {
    const ref = this.referenceInput ? this.referenceInput.value.trim() : this.data.reference;

    return {
      reference: ref,
      html: this.data.html || '',
      url: this.data.url || '',
      isOpen: this.data.isOpen ?? false,
    };
  }

  public validate(savedData: BiblePassageBlockData): boolean {
    const hasReference = Boolean(savedData.reference && savedData.reference.trim());
    const hasHtml = Boolean(savedData.html && savedData.html.trim());

    return hasReference || hasHtml || this.isEditing;
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
