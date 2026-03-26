import type EditorJS from '@editorjs/editorjs';
import { icons } from 'src/components/editor/icons';
import './CreateNestedToolPanel.css';
import '../shared/contentStyles.css';

type InsertBlockData = Record<string, unknown>;

export type NestedToolPanelItem = {
  type: string;
  label: string;
  icon: string;
  data?: InsertBlockData;
};

export type NestedInlineToolAction =
  | 'paragraph'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'unorderedList'
  | 'orderedList'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'ltr'
  | 'rtl'
  | 'link';

export type NestedInlineToolItem = {
  action: NestedInlineToolAction;
  label: string;
  icon: string;
};

export type NestedStyleOption = {
  label: string;
  value: string;
};

type NestedToolPanelOptions = {
  editorGetter: () => EditorJS | null;
  onInsert?: (type: string) => void;
  title?: string;
};
type FocusRoot = ParentNode | null;

export const DEFAULT_NESTED_STYLE_OPTIONS: NestedStyleOption[] = [
  { label: 'Style', value: '' },
  { label: 'DBS Instruction', value: 'dbs-instruction' },
  { label: 'Enrichment', value: 'enrichment' },
  { label: 'Gospel Prayer', value: 'gospel-prayer' },
  { label: 'Gospel Text', value: 'gospel-text' },
  { label: 'Quote Left', value: 'quote-left' },
  { label: 'Quote Right', value: 'quote-right' },
  { label: 'Version', value: 'version' },
  { label: 'Vertical Text', value: 'vertical-text' },
  { label: 'Year', value: 'year' },
];

function findEditorHolderFromElement(element: Element | null): HTMLElement | null {
  return element
    ?.closest('.cg-tool__editor-frame')
    ?.querySelector('.cg-tool__editor-holder') as HTMLElement | null;
}

function makeButtonContent(icon: string): string {
  return `
    <span class="nested-tool-panel__icon" aria-hidden="true">
      ${icon.replace(/class="editor-icon"/g, 'class="editor-icon nested-tool-icon"')}
    </span>
  `;
}

function focusLastEditableBlock(root: FocusRoot = document): void {
  window.setTimeout(() => {
    const editables = Array.from(root?.querySelectorAll?.('[contenteditable="true"]') ?? []);
    const lastEditable = editables[editables.length - 1];

    if (!(lastEditable instanceof HTMLElement)) {
      return;
    }

    lastEditable.focus();

    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(lastEditable);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  }, 0);
}

function insertBlock(
  editor: EditorJS,
  item: NestedToolPanelItem,
  focusRoot: FocusRoot = document,
): void {
  editor.blocks.insert(item.type, item.data || {});
  focusLastEditableBlock(focusRoot);
}

function insertListBlock(
  editor: EditorJS,
  style: 'ordered' | 'unordered',
  focusRoot: FocusRoot = document,
): void {
  editor.blocks.insert('list', {
    style,
    meta: {},
    items: [
      {
        content: '',
        meta: {},
        items: [],
      },
    ],
  });
  focusLastEditableBlock(focusRoot);
}

function findCurrentEditable(): HTMLElement | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  let node = selection.anchorNode;

  if (node && node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }

  if (!(node instanceof HTMLElement)) {
    return null;
  }

  const editable = node.closest('[contenteditable="true"]');

  if (!(editable instanceof HTMLElement)) {
    return null;
  }

  return editable;
}

function applyInlineFormat(action: NestedInlineToolAction): void {
  if (action === 'paragraph' || action === 'h2' || action === 'h3' || action === 'h4') {
    const editable = findCurrentEditable();

    if (!editable) {
      return;
    }

    if (action === 'paragraph') {
      editable.removeAttribute('data-block-style');
    } else {
      editable.dataset.blockStyle = action;
    }

    editable.focus();
    return;
  }

  if (action === 'link') {
    const url = window.prompt('Enter link URL');

    if (!url) {
      return;
    }

    document.execCommand('createLink', false, url);
    return;
  }

  if (action === 'ltr' || action === 'rtl') {
    const editable = findCurrentEditable();

    if (!editable) {
      return;
    }

    editable.setAttribute('dir', action);
    return;
  }

  if (action === 'alignLeft' || action === 'alignCenter' || action === 'alignRight') {
    const editable = findCurrentEditable();

    if (!editable) {
      return;
    }

    if (action === 'alignLeft') {
      editable.style.textAlign = 'left';
    } else if (action === 'alignCenter') {
      editable.style.textAlign = 'center';
    } else {
      editable.style.textAlign = 'right';
    }

    return;
  }

  document.execCommand(action, false);
}

function applyStyleValue(styleValue: string): void {
  const editable = findCurrentEditable();

  if (!editable) {
    return;
  }

  editable.dataset.textStyle = styleValue;
}

function createBlockButton(
  item: NestedToolPanelItem,
  options: NestedToolPanelOptions,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nested-tool-panel__button';
  button.dataset.toolType = item.type;
  button.title = item.label;
  button.innerHTML = makeButtonContent(item.icon);
  button.addEventListener('click', () => {
    const focusRoot = findEditorHolderFromElement(button);
    if (item.type === 'ltr' || item.type === 'rtl' || item.type === 'link') {
      applyInlineFormat(item.type);
      return;
    }

    const editor = options.editorGetter();

    if (!editor) {
      return;
    }

    insertBlock(editor, item, focusRoot);

    if (options.onInsert) {
      options.onInsert(item.type);
    }
  });

  return button;
}

function createInlineButton(
  item: NestedInlineToolItem,
  options: NestedToolPanelOptions,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nested-tool-panel__button nested-tool-panel__button--inline';
  button.dataset.inlineAction = item.action;
  button.title = item.label;
  button.innerHTML = makeButtonContent(item.icon);

  button.addEventListener('mousedown', (event) => {
    if (item.action === 'unorderedList' || item.action === 'orderedList') {
      event.preventDefault();

      const editor = options.editorGetter();
      const focusRoot = findEditorHolderFromElement(button);

      if (!editor) {
        return;
      }

      insertListBlock(editor, item.action === 'orderedList' ? 'ordered' : 'unordered', focusRoot);
      return;
    }

    event.preventDefault();
    applyInlineFormat(item.action);
  });

  return button;
}

function createStyleDropdown(styleOptions: NestedStyleOption[]): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'nested-tool-panel__select';
  select.setAttribute('aria-label', 'Text style');

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Style';
  placeholder.selected = true;
  select.appendChild(placeholder);

  styleOptions.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    if (!select.value) {
      return;
    }

    applyStyleValue(select.value);
    select.value = '';
  });

  return select;
}

export function createNestedToolPanel(
  items: NestedToolPanelItem[],
  options: NestedToolPanelOptions,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'nested-tool-panel';

  const inlineGroup = document.createElement('div');
  inlineGroup.className = 'nested-tool-panel__group nested-tool-panel__group--top';

  inlineGroup.appendChild(createStyleDropdown(DEFAULT_NESTED_STYLE_OPTIONS));

  DEFAULT_NESTED_INLINE_TOOL_PANEL_ITEMS.forEach((item) => {
    inlineGroup.appendChild(createInlineButton(item, options));
  });

  panel.appendChild(inlineGroup);

  const divider = document.createElement('div');
  divider.className = 'nested-tool-panel__divider';
  panel.appendChild(divider);

  const blockGroup = document.createElement('div');
  blockGroup.className = 'nested-tool-panel__group';

  blockGroup.className = 'nested-tool-panel__group nested-tool-panel__group--bottom';

  items.forEach((item) => {
    blockGroup.appendChild(createBlockButton(item, options));
  });

  panel.appendChild(blockGroup);
  return panel;
}

export const DEFAULT_NESTED_TOOL_PANEL_ITEMS: NestedToolPanelItem[] = [
  {
    type: 'image',
    label: 'Image',
    icon: icons.image,
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
  {
    type: 'ltr',
    label: 'LTR',
    icon: icons.ltr,
  },
  {
    type: 'rtl',
    label: 'RTL',
    icon: icons.rtl,
  },
  {
    type: 'link',
    label: 'Link',
    icon: icons.link,
  },
];

export const DEFAULT_NESTED_INLINE_TOOL_PANEL_ITEMS: NestedInlineToolItem[] = [
  {
    action: 'paragraph',
    label: 'Paragraph',
    icon: icons.p,
  },
  {
    action: 'h2',
    label: 'H2',
    icon: icons.h2,
  },
  {
    action: 'h3',
    label: 'H3',
    icon: icons.h3,
  },
  {
    action: 'h4',
    label: 'H4',
    icon: icons.h4,
  },
  {
    action: 'bold',
    label: 'Bold',
    icon: icons.bold,
  },
  {
    action: 'italic',
    label: 'Italic',
    icon: icons.italics,
  },
  {
    action: 'underline',
    label: 'Underline',
    icon: icons.underline,
  },
  {
    action: 'unorderedList',
    label: 'Bullet List',
    icon: icons.unorderedList,
  },
  {
    action: 'orderedList',
    label: 'Number List',
    icon: icons.numberedList,
  },
  {
    action: 'alignLeft',
    label: 'Align Left',
    icon: icons.alignLeft,
  },
  {
    action: 'alignCenter',
    label: 'Align Center',
    icon: icons.alignCenter,
  },
  {
    action: 'alignRight',
    label: 'Align Right',
    icon: icons.alignRight,
  },
];
