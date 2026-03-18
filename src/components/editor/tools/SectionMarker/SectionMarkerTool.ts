import type { BlockTool, ToolConfig } from '@editorjs/editorjs';
import { getCurrentLanguage } from 'src/i18n/languageState';
import { t } from 'src/i18n';
import './SectionMarkerTool.css';
import { icons } from 'src/components/editor/icons';

import {
  DEFAULT_SECTION_MARKER_BLOCK_DATA,
  type SectionMarkerBlockData,
  type SectionTheme,
} from 'src/types/content/SectionMarkerBlock';

import type { SectionOption, SectionMarkerToolConstructorArgs } from './types';

const SECTION_OPTIONS: SectionOption[] = [
  { value: 'back', labelKey: 'sectionMarker.lookBack' },
  { value: 'up', labelKey: 'sectionMarker.lookUp' },
  { value: 'forward', labelKey: 'sectionMarker.lookForward' },
];

export default class SectionMarkerTool implements BlockTool {
  private data: SectionMarkerBlockData;
  private wrapper: HTMLDivElement | null;
  private cardEl: HTMLDivElement | null;
  private iconEl: HTMLSpanElement | null;
  private labelEl: HTMLSpanElement | null;
  private actionsEl: HTMLDivElement | null;
  private editButtonEl: HTMLButtonElement | null;
  private editorEl: HTMLDivElement | null;
  private selectEl: HTMLSelectElement | null;
  private doneButtonEl: HTMLButtonElement | null;
  private isEditing: boolean;

  public static get toolbox() {
    return {
      title: 'Section Marker',
      icon: icons.sectionMarker,
    };
  }

  public constructor({ data }: SectionMarkerToolConstructorArgs) {
    this.data = {
      ...DEFAULT_SECTION_MARKER_BLOCK_DATA,
      ...data,
    };

    this.wrapper = null;
    this.cardEl = null;
    this.iconEl = null;
    this.labelEl = null;
    this.actionsEl = null;
    this.editButtonEl = null;
    this.editorEl = null;
    this.selectEl = null;
    this.doneButtonEl = null;
    this.isEditing = false;
  }

  public render(): HTMLElement {
    const lang = getCurrentLanguage();

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'section-marker-tool';

    this.cardEl = document.createElement('div');
    this.cardEl.className = 'section-marker-tool__card';
    this.cardEl.setAttribute('role', 'button');
    this.cardEl.tabIndex = 0;

    this.iconEl = document.createElement('span');
    this.iconEl.className = 'section-marker-tool__icon';
    this.iconEl.setAttribute('aria-hidden', 'true');

    this.labelEl = document.createElement('span');
    this.labelEl.className = 'section-marker-tool__label';

    this.actionsEl = document.createElement('div');
    this.actionsEl.className = 'section-marker-tool__actions';

    this.editButtonEl = document.createElement('button');
    this.editButtonEl.type = 'button';
    this.editButtonEl.className = 'section-marker-tool__edit-btn';
    this.editButtonEl.textContent = t(lang, 'common.edit') || 'Edit';
    this.editButtonEl.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setEditing(true);
    });

    this.actionsEl.appendChild(this.editButtonEl);
    this.cardEl.appendChild(this.iconEl);
    this.cardEl.appendChild(this.labelEl);
    this.cardEl.appendChild(this.actionsEl);

    this.cardEl.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.setEditing(true);
      }
    });

    this.editorEl = document.createElement('div');
    this.editorEl.className = 'section-marker-tool__editor';

    this.selectEl = document.createElement('select');
    this.selectEl.className = 'section-marker-tool__select';

    SECTION_OPTIONS.forEach((option) => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = t(lang, option.labelKey);

      if (option.value === this.data.theme) {
        optionEl.selected = true;
      }

      this.selectEl?.appendChild(optionEl);
    });

    this.selectEl.addEventListener('change', () => {
      this.data.theme = (this.selectEl?.value as SectionTheme) || 'back';
      this.updateCard();
    });

    this.doneButtonEl = document.createElement('button');
    this.doneButtonEl.type = 'button';
    this.doneButtonEl.className = 'section-marker-tool__done-btn';
    this.doneButtonEl.textContent = t(lang, 'common.done') || 'Done';
    this.doneButtonEl.addEventListener('click', (event) => {
      event.preventDefault();
      this.setEditing(false);
    });

    this.editorEl.appendChild(this.selectEl);
    this.editorEl.appendChild(this.doneButtonEl);

    this.wrapper.appendChild(this.cardEl);
    this.wrapper.appendChild(this.editorEl);

    this.updateCard();
    this.setEditing(false);

    return this.wrapper;
  }

  private setEditing(isEditing: boolean): void {
    this.isEditing = isEditing;

    if (!this.wrapper || !this.cardEl || !this.editorEl) {
      return;
    }

    if (isEditing) {
      this.wrapper.classList.add('section-marker-tool--editing');
      this.cardEl.hidden = true;
      this.editorEl.hidden = false;

      window.setTimeout(() => {
        this.selectEl?.focus();
      }, 0);

      return;
    }

    this.wrapper.classList.remove('section-marker-tool--editing');
    this.editorEl.hidden = true;
    this.cardEl.hidden = false;
    this.updateCard();
  }

  private getLabel(): string {
    const lang = getCurrentLanguage();

    if (this.data.theme === 'back') {
      return t(lang, 'sectionMarker.lookBack');
    }

    if (this.data.theme === 'up') {
      return t(lang, 'sectionMarker.lookUp');
    }

    return t(lang, 'sectionMarker.lookForward');
  }

  private getArrowSvg(): string {
    if (this.data.theme === 'back') {
      return `
        <svg viewBox="0 0 24 24" class="section-marker-tool__arrow-svg"
          xmlns="http://www.w3.org/2000/svg" fill="none"
          stroke="currentColor" stroke-width="2.4"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H7"></path>
          <path d="M12 17l-5-5 5-5"></path>
        </svg>
      `;
    }

    if (this.data.theme === 'up') {
      return `
        <svg viewBox="0 0 24 24" class="section-marker-tool__arrow-svg"
          xmlns="http://www.w3.org/2000/svg" fill="none"
          stroke="currentColor" stroke-width="2.4"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 19V7"></path>
          <path d="M17 12l-5-5-5 5"></path>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 24 24" class="section-marker-tool__arrow-svg"
        xmlns="http://www.w3.org/2000/svg" fill="none"
        stroke="currentColor" stroke-width="2.4"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h12"></path>
        <path d="M12 7l5 5-5 5"></path>
      </svg>
    `;
  }

  private updateCard(): void {
    if (!this.cardEl || !this.iconEl || !this.labelEl) {
      return;
    }

    this.cardEl.setAttribute('data-theme', this.data.theme);
    this.iconEl.innerHTML = this.getArrowSvg();
    this.labelEl.textContent = this.getLabel().toUpperCase();

    if (this.selectEl) {
      this.selectEl.value = this.data.theme;
    }
  }

  public save(): SectionMarkerBlockData {
    return {
      theme: (this.selectEl?.value as SectionTheme) || this.data.theme,
    };
  }
}
