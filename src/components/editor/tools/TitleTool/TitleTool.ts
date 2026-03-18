import './TitleTool.css';

import type { API } from '@editorjs/editorjs';

import { DEFAULT_TITLE_BLOCK_DATA, type TitleBlockData } from 'src/types/content/TitleBlock';

import type { TitleToolConfig, TitleToolConstructorArgs, TitleToolOption } from './types';

export default class TitleTool {
  private api: API;
  private config: TitleToolConfig;
  private data: TitleBlockData;

  private readOnly: boolean;

  private wrapper!: HTMLDivElement;

  private summaryRow!: HTMLDivElement;

  private body!: HTMLDivElement;

  private numberInput!: HTMLInputElement;

  private titleInput!: HTMLInputElement;

  private languageSelect!: HTMLSelectElement;

  private seriesSelect!: HTMLSelectElement;

  public static get toolbox() {
    return {
      title: 'Title',
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6h16v2H13v10h-2V8H4V6zm0 14h16v-2H4v2z"
            fill="currentColor"
          />
        </svg>
      `,
    };
  }

  public static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, config, readOnly }: TitleToolConstructorArgs) {
    this.api = api;
    this.config = config || {};
    this.readOnly = Boolean(readOnly);

    this.data = {
      ...DEFAULT_TITLE_BLOCK_DATA,
      ...data,
      isOpen: data?.isOpen !== undefined ? Boolean(data.isOpen) : DEFAULT_TITLE_BLOCK_DATA.isOpen,
    };
  }

  public render() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'title-tool';

    this.summaryRow = document.createElement('div');
    this.summaryRow.className = 'title-tool__summary';
    this.summaryRow.addEventListener('click', () => {
      if (this.readOnly) {
        return;
      }

      this.data.isOpen = !this.data.isOpen;
      this.syncView();
    });

    this.body = document.createElement('div');
    this.body.className = 'title-tool__body';

    this.numberInput = document.createElement('input');
    this.numberInput.type = 'text';
    this.numberInput.className = 'title-tool__input title-tool__input--number';
    this.numberInput.placeholder = 'Series number';
    this.numberInput.value = this.data.seriesNumber;
    this.numberInput.addEventListener('input', () => {
      this.data.seriesNumber = this.numberInput.value;
      this.updateSummary();
    });

    this.titleInput = document.createElement('input');
    this.titleInput.type = 'text';
    this.titleInput.className = 'title-tool__input title-tool__input--title';
    this.titleInput.placeholder = 'Enter title';
    this.titleInput.value = this.data.title;
    this.titleInput.addEventListener('input', () => {
      this.data.title = this.titleInput.value;
      this.updateSummary();
    });

    this.languageSelect = document.createElement('select');
    this.languageSelect.className = 'title-tool__select';
    this.populateSelect(this.languageSelect, this.getLanguageOptions(), this.data.language);
    this.languageSelect.addEventListener('change', () => {
      this.data.language = this.languageSelect.value;
    });

    this.seriesSelect = document.createElement('select');
    this.seriesSelect.className = 'title-tool__select';
    this.populateSelect(this.seriesSelect, this.getSeriesOptions(), this.data.series);
    this.seriesSelect.addEventListener('change', () => {
      this.data.series = this.seriesSelect.value;
    });

    const topRow = document.createElement('div');
    topRow.className = 'title-tool__row';
    topRow.appendChild(this.numberInput);
    topRow.appendChild(this.titleInput);

    const secondRow = document.createElement('div');
    secondRow.className = 'title-tool__row';
    secondRow.appendChild(this.createField('Language', this.languageSelect));
    secondRow.appendChild(this.createField('Series', this.seriesSelect));

    this.body.appendChild(topRow);
    this.body.appendChild(secondRow);

    this.wrapper.appendChild(this.summaryRow);
    this.wrapper.appendChild(this.body);

    this.updateSummary();
    this.syncView();

    return this.wrapper;
  }

  public save(): TitleBlockData {
    return {
      seriesNumber: this.numberInput.value.trim(),
      title: this.titleInput.value.trim(),
      language: this.languageSelect.value,
      series: this.seriesSelect.value,
      isOpen: this.data.isOpen,
    };
  }

  public validate(savedData: TitleBlockData): boolean {
    return Boolean(savedData.title && savedData.title.trim());
  }

  private createField(labelText: string, element: HTMLElement) {
    const field = document.createElement('label');
    field.className = 'title-tool__field';

    const label = document.createElement('span');
    label.className = 'title-tool__label';
    label.textContent = labelText;

    field.appendChild(label);
    field.appendChild(element);

    return field;
  }

  private getLanguageOptions(): TitleToolOption[] {
    return (
      this.config.languages || [
        {
          value: 'english',
          label: 'English',
        },
        {
          value: 'spanish',
          label: 'Spanish',
        },
        {
          value: 'french',
          label: 'French',
        },
      ]
    );
  }

  private getSeriesOptions(): TitleToolOption[] {
    return (
      this.config.seriesOptions || [
        {
          value: 'multiply1',
          label: 'Multiply 1',
        },
        {
          value: 'multiply2',
          label: 'Multiply 2',
        },
        {
          value: 'multiply3',
          label: 'Multiply 3',
        },
      ]
    );
  }

  private populateSelect(
    select: HTMLSelectElement,
    options: TitleToolOption[],
    selectedValue: string,
  ) {
    select.innerHTML = '';

    options.forEach((optionData) => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      option.selected = optionData.value === selectedValue;
      select.appendChild(option);
    });
  }

  private updateSummary() {
    const number = this.data.seriesNumber.trim();
    const title = this.data.title.trim() || 'Untitled title';

    this.summaryRow.innerHTML = '';

    const text = document.createElement('div');
    text.className = 'title-tool__summary-text';

    if (number) {
      const numberSpan = document.createElement('span');
      numberSpan.className = 'title-tool__summary-number';
      numberSpan.textContent = `${number}.`;
      text.appendChild(numberSpan);
    }

    const titleSpan = document.createElement('span');
    titleSpan.className = 'title-tool__summary-title';
    titleSpan.textContent = title;
    text.appendChild(titleSpan);

    this.summaryRow.appendChild(text);

    if (!this.readOnly) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'title-tool__toggle';
      toggle.setAttribute(
        'aria-label',
        this.data.isOpen ? 'Collapse title tool' : 'Expand title tool',
      );
      toggle.textContent = this.data.isOpen ? '−' : '+';
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        this.data.isOpen = !this.data.isOpen;
        this.syncView();
      });
      this.summaryRow.appendChild(toggle);
    }
  }

  private syncView() {
    if (this.data.isOpen) {
      this.wrapper.classList.add('title-tool--open');
      this.body.style.display = '';
    } else {
      this.wrapper.classList.remove('title-tool--open');
      this.body.style.display = 'none';
    }

    this.updateSummary();
  }
}
