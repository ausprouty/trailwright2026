import './TextAreaTool.css';

import EditorJS, { type OutputData } from '@editorjs/editorjs';

import {
  DEFAULT_TEXT_AREA_BLOCK_DATA,
  type TextAreaBlockData,
} from 'src/types/content/TextAreaBlock';

import { icons } from 'src/components/editor/icons';

import {
  createNestedToolPanel,
  DEFAULT_NESTED_TOOL_PANEL_ITEMS,
} from 'src/components/editor/tools/CreateNestedToolPanel/CreateNestedToolPanel';

import type { TextAreaToolConfig, TextAreaToolConstructorArgs } from './types';

type NestedEditorApi = {
  isReady: Promise<void>;
  save: () => Promise<OutputData>;
  destroy?: () => void;
};

type BibleReference = {
  id?: string;
  marker: string;
  label: string;
  passage?: string;
  status?: 'not_loaded' | 'loaded' | 'error';
};

export default class TextAreaTool {
  private api: NestedEditorApi | null = null;

  private data: TextAreaBlockData;
  private readOnly: boolean;
  private config: TextAreaToolConfig;

  private wrapper!: HTMLDivElement;
  private editorHolder!: HTMLDivElement;
  private referencesHolder!: HTMLDivElement;
  private toolPanel: HTMLElement | null = null;

  public static get toolbox() {
    return {
      title: 'Text Area',
      icon: icons.textArea,
    };
  }

  public static get isReadOnlySupported(): boolean {
    return true;
  }

  constructor({ data, config, readOnly }: TextAreaToolConstructorArgs = {}) {
    this.readOnly = readOnly ?? false;
    this.config = config ?? { tools: {} };

    this.data = {
      content: data?.content ?? DEFAULT_TEXT_AREA_BLOCK_DATA.content,
      references: data?.references ?? [],
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'text-area-tool';

    const body = document.createElement('div');
    body.className = 'text-area-tool__body';

    const editorFrame = document.createElement('div');
    editorFrame.className = 'text-area-tool__editor-frame';

    this.editorHolder = document.createElement('div');
    this.editorHolder.className = 'text-area-tool__editor-holder';

    this.referencesHolder = document.createElement('div');
    this.referencesHolder.className = 'text-area-tool__references-holder';

    if (!this.readOnly) {
      this.toolPanel = createNestedToolPanel(DEFAULT_NESTED_TOOL_PANEL_ITEMS, {
        editorGetter: () => this.api as EditorJS | null,
        title: 'Edit Block',
      });
    }

    this.stopNestedEditorKeyEvents();

    editorFrame.appendChild(this.editorHolder);

    if (this.toolPanel) {
      editorFrame.appendChild(this.toolPanel);
    }

    body.appendChild(editorFrame);
    body.appendChild(this.referencesHolder);

    this.wrapper.appendChild(body);

    void this.createNestedEditor();

    return this.wrapper;
  }
  private stopNestedEditorKeyEvents(): void {
    const stopPropagation = (event: KeyboardEvent) => {
      event.stopPropagation();
    };

    this.editorHolder.addEventListener('keydown', stopPropagation);
    this.editorHolder.addEventListener('keyup', stopPropagation);
    this.editorHolder.addEventListener('keypress', stopPropagation);
  }

  private async createNestedEditor(): Promise<void> {
    this.api = new EditorJS({
      holder: this.editorHolder,
      readOnly: this.readOnly,
      tools: this.config.tools,
      data: this.data.content,
      minHeight: 80,
      onChange: () => {
        void this.updateBibleMarkersFromEditor();
      },
    });

    await this.api.isReady;
    await this.updateBibleMarkersFromEditor();
  }

  private async updateBibleMarkersFromEditor(): Promise<void> {
    if (!this.api) {
      return;
    }

    const content = await this.api.save();
    const plainText = this.extractPlainText(content);
    const markers = this.extractBibleMarkers(plainText);

    this.syncReferencesWithMarkers(markers);
    this.renderBibleReferencePanels(markers);
  }

  private extractPlainText(content: OutputData): string {
    return content.blocks
      .map((block) => {
        const data = block.data as Record<string, unknown>;

        if (block.type === 'paragraph' || block.type === 'header') {
          return typeof data.text === 'string' ? data.text : '';
        }

        if (block.type === 'list') {
          return this.extractListText(data);
        }

        return '';
      })
      .filter((text) => text.trim() !== '')
      .join('\n');
  }

  private extractListText(data: Record<string, unknown>): string {
    const items = data.items;

    if (!Array.isArray(items)) {
      return '';
    }

    return items
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (
          item &&
          typeof item === 'object' &&
          'content' in item &&
          typeof item.content === 'string'
        ) {
          return item.content;
        }

        return '';
      })
      .filter((text) => text.trim() !== '')
      .join('\n');
  }

  private extractBibleMarkers(text: string): string[] {
    const matches = text.match(/\{[^}]+\}/g) ?? [];
    return [...new Set(matches)];
  }

  private syncReferencesWithMarkers(markers: string[]): void {
    const existingReferences = (this.data.references ?? []) as BibleReference[];

    const updatedReferences = markers.map((marker) => {
      const existingReference = existingReferences.find((reference) => reference.marker === marker);

      if (existingReference) {
        return existingReference;
      }

      return {
        id: this.createReferenceId(),
        marker,
        label: this.markerToLabel(marker),
        passage: '',
        status: 'not_loaded' as const,
      };
    });

    this.data.references = updatedReferences;
  }

  private renderBibleReferencePanels(markers: string[]): void {
    this.referencesHolder.innerHTML = '';

    markers.forEach((marker) => {
      const reference = this.getReference(marker);

      const panel = document.createElement('div');
      panel.className = 'text-area-tool__bible-ref-panel';

      const header = document.createElement('div');
      header.className = 'text-area-tool__bible-ref-header';

      const title = document.createElement('strong');
      title.textContent = `Marker found: ${marker}`;

      const hideButton = document.createElement('button');
      hideButton.type = 'button';
      hideButton.className = 'text-area-tool__hide-button';
      hideButton.textContent = 'Hide';

      hideButton.addEventListener('click', () => {
        panel.style.display = 'none';
      });

      header.appendChild(title);
      header.appendChild(hideButton);

      const status = document.createElement('div');
      status.className = 'text-area-tool__bible-ref-status';
      status.textContent = `Status: ${this.getReferenceStatusText(reference)}`;

      const loadButton = document.createElement('button');
      loadButton.type = 'button';
      loadButton.className = 'text-area-tool__load-bible-button';
      loadButton.textContent = 'Load Bible Ref';

      loadButton.addEventListener('click', () => {
        void this.handleLoadBibleReference(marker);
      });

      const previewLabel = document.createElement('div');
      previewLabel.className = 'text-area-tool__preview-label';
      previewLabel.textContent = 'Preview';

      const preview = document.createElement('div');
      preview.className = 'text-area-tool__bible-preview';

      if (reference?.passage) {
        preview.innerHTML = reference.passage;
      } else {
        const empty = document.createElement('em');
        empty.textContent = 'No Bible text loaded yet.';
        preview.appendChild(empty);
      }

      panel.appendChild(header);
      panel.appendChild(status);
      panel.appendChild(loadButton);
      panel.appendChild(previewLabel);
      panel.appendChild(preview);

      this.referencesHolder.appendChild(panel);
    });
  }

  private getReference(marker: string): BibleReference | undefined {
    return ((this.data.references ?? []) as BibleReference[]).find(
      (reference) => reference.marker === marker,
    );
  }

  private getReferenceStatusText(reference: BibleReference | undefined): string {
    if (!reference || reference.status === 'not_loaded') {
      return 'Not loaded';
    }

    if (reference.status === 'loaded') {
      return 'Loaded';
    }

    if (reference.status === 'error') {
      return 'Could not load reference';
    }

    return 'Not loaded';
  }

  private async handleLoadBibleReference(marker: string): Promise<void> {
    const label = this.markerToLabel(marker);

    try {
      /**
       * Replace this placeholder with the same Bible-loading logic
       * used by your CollapsibleGroupBlock/BibleReferenceBlock.
       */
      const passage = await this.fetchBiblePassage(label);

      this.updateReference(marker, {
        passage,
        status: 'loaded',
      });
    } catch {
      this.updateReference(marker, {
        passage: '',
        status: 'error',
      });
    }

    const markers = this.extractBibleMarkers(this.extractPlainText(await this.api!.save()));

    this.renderBibleReferencePanels(markers);
  }

  private updateReference(marker: string, updates: Partial<BibleReference>): void {
    const references = (this.data.references ?? []) as BibleReference[];

    this.data.references = references.map((reference) => {
      if (reference.marker !== marker) {
        return reference;
      }

      return {
        ...reference,
        ...updates,
      };
    });
  }

  private fetchBiblePassage(label: string): Promise<string> {
    return Promise.reject(new Error(`Connect Bible loader for ${label}`));
  }

  private markerToLabel(marker: string): string {
    return marker.replace(/^\{|\}$/g, '').trim();
  }

  private createReferenceId(): string {
    return `ref_${Math.random().toString(36).slice(2, 10)}`;
  }

  public async save(): Promise<TextAreaBlockData> {
    let content: OutputData = {
      time: Date.now(),
      blocks: [],
      version: '2.31.5',
    };

    if (this.api) {
      content = await this.api.save();
    }

    const plainText = this.extractPlainText(content);
    const markers = this.extractBibleMarkers(plainText);
    this.syncReferencesWithMarkers(markers);

    return {
      content,
      references: this.data.references ?? [],
    };
  }

  public destroy(): void {
    if (this.api && typeof this.api.destroy === 'function') {
      this.api.destroy();
      this.api = null;
    }
  }

  public validate(savedData: TextAreaBlockData): boolean {
    return Array.isArray(savedData.content?.blocks);
  }
}
