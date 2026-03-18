import type { BlockTool } from '@editorjs/editorjs';
import { getCurrentLanguage } from 'src/i18n/languageState';
import { t } from 'src/i18n';
import './NotesAreaTool.css';
import { icons } from 'src/components/editor/icons';

interface NotesAreaData {
  id: number;
  notes: string;
}

let notesAreaCounter = 1;

function getNextNotesAreaId(): number {
  const nextId = notesAreaCounter;
  notesAreaCounter += 1;
  return nextId;
}

export default class NotesAreaTool implements BlockTool {
  private data: NotesAreaData;
  private wrapper: HTMLDivElement | null;
  private textareaEl: HTMLTextAreaElement | null;

  public static get toolbox() {
    return {
      title: 'Notes Area',
      icon: icons.notesArea,
    };
  }

  public constructor({ data }: { data?: Partial<NotesAreaData> }) {
    this.data = {
      id: typeof data?.id === 'number' ? data.id : getNextNotesAreaId(),
      notes: data?.notes ?? '',
    };

    this.wrapper = null;
    this.textareaEl = null;
  }

  public render(): HTMLElement {
    const lang = getCurrentLanguage();

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'notes-area-tool';
    this.wrapper.setAttribute('data-notes-id', String(this.data.id));

    const cardEl = document.createElement('div');
    cardEl.className = 'notes-area-tool__card';

    const labelEl = document.createElement('label');
    labelEl.className = 'notes-area-tool__label';
    labelEl.setAttribute('for', `notes-area-tool-textarea-${this.data.id}`);
    labelEl.textContent = t(lang, 'common.notesClickOutsideToSave');

    this.textareaEl = document.createElement('textarea');
    this.textareaEl.className = 'notes-area-tool__textarea';
    this.textareaEl.id = `notes-area-tool-textarea-${this.data.id}`;
    this.textareaEl.value = this.data.notes;
    this.textareaEl.rows = 3;
    this.textareaEl.placeholder = '';

    cardEl.appendChild(labelEl);
    cardEl.appendChild(this.textareaEl);
    this.wrapper.appendChild(cardEl);

    return this.wrapper;
  }

  public save(): NotesAreaData {
    return {
      id: this.data.id,
      notes: this.textareaEl?.value ?? '',
    };
  }
}
