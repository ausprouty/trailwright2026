import './OikosListTool.css';
import { icons } from 'src/components/editor/icons';

import {
  DEFAULT_OIKOS_LIST_BLOCK_DATA,
  type OikosListBlockData,
} from 'src/types/content/OikosListBlock';

import type { OikosListToolConstructorArgs } from './types';

export default class OikosListTool {
  private data: OikosListBlockData;
  private readOnly: boolean;
  private wrapper: HTMLDivElement | null;

  public static get toolbox() {
    return {
      title: 'Oikos List Area',
      icon: icons.oikosList,
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ readOnly = false }: OikosListToolConstructorArgs) {
    this.data = DEFAULT_OIKOS_LIST_BLOCK_DATA;
    this.readOnly = readOnly;
    this.wrapper = null;
  }

  render(): HTMLDivElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'oikos-list-tool';

    const intro = document.createElement('p');
    intro.className = 'oikos-list-tool__intro';
    intro.textContent = 'This area will render as an interactive Oikos List on the page.';

    const table = document.createElement('div');
    table.className = 'oikos-list-tool__table';

    const header = document.createElement('div');
    header.className = 'oikos-list-tool__header';

    const headerName = document.createElement('div');
    headerName.className = 'oikos-list-tool__header-cell oikos-list-tool__header-cell--name';
    headerName.textContent = 'Name';

    const headerStatus = document.createElement('div');
    headerStatus.className = 'oikos-list-tool__header-cell';
    headerStatus.textContent = 'Status';

    const headerNextStep = document.createElement('div');
    headerNextStep.className = 'oikos-list-tool__header-cell';
    headerNextStep.textContent = 'Next Step';

    const headerDate = document.createElement('div');
    headerDate.className = 'oikos-list-tool__header-cell';
    headerDate.textContent = 'Date';

    header.appendChild(headerName);
    header.appendChild(headerStatus);
    header.appendChild(headerNextStep);
    header.appendChild(headerDate);

    table.appendChild(header);

    for (let i = 0; i < 5; i += 1) {
      table.appendChild(this.createPreviewRow());
    }

    this.wrapper.appendChild(intro);
    this.wrapper.appendChild(table);

    return this.wrapper;
  }

  private createPreviewRow(): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'oikos-list-tool__row';

    const nameCell = document.createElement('div');
    nameCell.className = 'oikos-list-tool__cell';

    const nameBox = document.createElement('div');
    nameBox.className = 'oikos-list-tool__placeholder-input';
    nameCell.appendChild(nameBox);

    const statusCell = document.createElement('div');
    statusCell.className = 'oikos-list-tool__cell';

    const statusBox = document.createElement('div');
    statusBox.className =
      'oikos-list-tool__placeholder-input oikos-list-tool__placeholder-input--small';
    statusCell.appendChild(statusBox);

    const nextStepCell = document.createElement('div');
    nextStepCell.className = 'oikos-list-tool__cell';

    const nextStepBox = document.createElement('div');
    nextStepBox.className = 'oikos-list-tool__placeholder-input';
    nextStepCell.appendChild(nextStepBox);

    const dateCell = document.createElement('div');
    dateCell.className = 'oikos-list-tool__cell';

    const dateBox = document.createElement('div');
    dateBox.className =
      'oikos-list-tool__placeholder-input oikos-list-tool__placeholder-input--small';
    dateCell.appendChild(dateBox);

    row.appendChild(nameCell);
    row.appendChild(statusCell);
    row.appendChild(nextStepCell);
    row.appendChild(dateCell);

    return row;
  }

  save(): OikosListBlockData {
    return this.data;
  }

  validate(): boolean {
    return true;
  }
}
