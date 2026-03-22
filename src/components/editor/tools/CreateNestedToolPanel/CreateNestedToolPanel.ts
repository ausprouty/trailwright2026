import type EditorJS from '@editorjs/editorjs';
import { icons } from 'src/components/editor/icons';
import './CreateNestedToolPanel.css';

type InsertBlockData = Record<string, unknown>;

export type NestedToolPanelItem = {
  type: string;
  label: string;
  icon: string;
  data?: InsertBlockData;
};

type NestedToolPanelOptions = {
  editorGetter: () => EditorJS | null;
  onInsert?: (type: string) => void;
  title?: string;
};

function makeButtonContent(item: NestedToolPanelItem): string {
  return `
    <span class="nested-tool-panel__icon" aria-hidden="true">
      ${item.icon}
    </span>
    <span class="nested-tool-panel__label">${item.label}</span>
  `;
}

function insertBlock(editor: EditorJS, item: NestedToolPanelItem): void {
  editor.blocks.insert(item.type, item.data || {});
}

export function createNestedToolPanel(
  items: NestedToolPanelItem[],
  options: NestedToolPanelOptions,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'nested-tool-panel';

  items.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nested-tool-panel__button';
    button.dataset.toolType = item.type;
    button.title = item.label;
    button.innerHTML = makeButtonContent(item);

    button.addEventListener('click', () => {
      const editor = options.editorGetter();

      if (!editor) {
        return;
      }

      insertBlock(editor, item);

      if (options.onInsert) {
        options.onInsert(item.type);
      }
    });

    panel.appendChild(button);
  });

  return panel;
}

export const DEFAULT_NESTED_TOOL_PANEL_ITEMS: NestedToolPanelItem[] = [
  {
    type: 'header',
    label: 'H2',
    icon: icons.title,
    data: {
      text: '',
      level: 2,
    },
  },
  {
    type: 'header',
    label: 'H3',
    icon: icons.title,
    data: {
      text: '',
      level: 3,
    },
  },
  {
    type: 'header',
    label: 'H4',
    icon: icons.title,
    data: {
      text: '',
      level: 4,
    },
  },

  {
    type: 'image',
    label: 'Image',
    icon: icons.image,
  },

  {
    type: 'list',
    label: 'Bullet List',
    icon: icons.unorderedList,
    data: {
      style: 'unordered',
      meta: {},
      items: [
        {
          content: '',
          meta: {},
          items: [],
        },
      ],
    },
  },
  {
    type: 'list',
    label: 'Number List',
    icon: icons.orderedList,
    data: {
      style: 'ordered',
      meta: {},
      items: [
        {
          content: '',
          meta: {},
          items: [],
        },
      ],
    },
  },
  {
    type: 'bibleReference',
    label: 'Bible Ref',
    icon: icons.bibleReference,
    data: {
      reference: '',
      passage: '',
      isOpen: true,
    },
  },
  {
    type: 'notesArea',
    label: 'Notes',
    icon: icons.notesArea,
  },
];
