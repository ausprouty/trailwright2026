import { iconListIcons } from 'src/components/content/shared/iconListIcons';
import './IconListTool.css';

type IconListItem = {
  icon: string;
  text: string;
};

type IconListData = {
  items: IconListItem[];
};

type IconListIconMeta = {
  label: string;
  preview?: string;
  svg: string;
};

export default class IconListTool {
  data: IconListData;
  wrapper: HTMLDivElement | null;

  static get toolbox() {
    return {
      title: 'Icon List',
      icon: `
        <svg class="editor-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="editor-icon__fill" cx="5" cy="7" r="2" />
          <path class="editor-icon__stroke" d="M10 7h9" />
          <circle class="editor-icon__fill" cx="5" cy="12" r="2" />
          <path class="editor-icon__stroke" d="M10 12h9" />
          <circle class="editor-icon__fill" cx="5" cy="17" r="2" />
          <path class="editor-icon__stroke" d="M10 17h9" />
        </svg>
      `,
    };
  }

  constructor({ data }: { data?: IconListData }) {
    this.data = {
      items: Array.isArray(data?.items) ? data.items : [],
    };

    this.wrapper = null;
  }

  render(): HTMLDivElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'icon-list-tool';

    this.renderItems();

    return this.wrapper;
  }

  save(): IconListData {
    return {
      items: this.data.items
        .map((item) => ({
          icon: item.icon || 'bullet',
          text: item.text || '',
        }))
        .filter((item) => item.text.trim() !== ''),
    };
  }

  private renderItems(): void {
    if (!this.wrapper) {
      return;
    }

    this.wrapper.innerHTML = '';

    const itemList = document.createElement('div');
    itemList.className = 'icon-list-tool__items';

    this.data.items.forEach((item, index) => {
      itemList.appendChild(this.renderItem(item, index));
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'icon-list-tool__add';
    addButton.textContent = '+ Add icon list item';

    addButton.addEventListener('click', () => {
      this.data.items.push({
        icon: 'bullet',
        text: '',
      });

      this.renderItems();
    });

    this.wrapper.appendChild(itemList);
    this.wrapper.appendChild(addButton);
  }

  private renderItem(item: IconListItem, index: number): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'icon-list-tool__item';

    const iconSelect = document.createElement('select');
    iconSelect.className = 'icon-list-tool__select';

    Object.entries(iconListIcons).forEach(([key, meta]) => {
      const typedMeta = meta as IconListIconMeta;

      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${typedMeta.preview || '•'} ${typedMeta.label || key}`;

      if (item.icon === key) {
        option.selected = true;
      }

      iconSelect.appendChild(option);
    });

    iconSelect.addEventListener('change', () => {
      const currentItem = this.getItem(index);

      if (currentItem) {
        currentItem.icon = iconSelect.value;
      }
    });

    const textInput = document.createElement('textarea');
    textInput.className = 'icon-list-tool__text';
    textInput.placeholder = 'Text';
    textInput.value = item.text || '';
    textInput.rows = 2;

    textInput.addEventListener('input', () => {
      const currentItem = this.getItem(index);

      if (currentItem) {
        currentItem.text = textInput.value;
      }
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'icon-list-tool__remove';
    removeButton.textContent = 'Remove';

    removeButton.addEventListener('click', () => {
      this.data.items.splice(index, 1);
      this.renderItems();
    });

    row.appendChild(iconSelect);
    row.appendChild(textInput);
    row.appendChild(removeButton);

    return row;
  }

  private getFirstIconKey(): string {
    const keys = Object.keys(iconListIcons);

    if (keys.length === 0) {
      return '';
    }

    return keys[0] || '';
  }

  private getItem(index: number): IconListItem | null {
    return this.data.items[index] || null;
  }
}
