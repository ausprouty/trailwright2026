import './BibleReferenceTool.css';
import type { SanitizerConfig } from '@editorjs/editorjs';

import { fetchBiblePassage, type BibleToolConfig } from '../shared/fetchBiblePassage';
import type { BibleReferenceItem } from 'src/types/shared/BibleReferenceItem';
import type { BibleReferenceToolData, EditorJSToolConstructorArgs } from './types';
import { icons } from 'src/components/editor/icons';
export default class BibleReferenceTool {
  private data: BibleReferenceToolData;
  private readonly readOnly: boolean;
  private readonly config: BibleToolConfig;
  private isEditing = true;
  private headerEl!: HTMLButtonElement;
  private bodyEl!: HTMLDivElement;
  private wrapper!: HTMLDivElement;
  private textArea!: HTMLTextAreaElement;
  private refsWrap!: HTMLDivElement;
  private previewWrap!: HTMLDivElement;
  private popupOverlay!: HTMLDivElement;
  private popupBody!: HTMLDivElement;

  constructor({ data, config, readOnly = false }: EditorJSToolConstructorArgs) {
    this.readOnly = readOnly;
    this.config = config || {};

    this.data = {
      text: data?.text || '',
      references: Array.isArray(data?.references)
        ? data.references.map((ref) => ({
            id: ref.id || this.makeId(),
            marker: ref.marker || '',
            label: ref.marker || '',
            passage: ref.passage || '',
          }))
        : [],
      isOpen: typeof data?.isOpen === 'boolean' ? data.isOpen : true,
    };
    this.isEditing = !this.readOnly;
  }

  public static get toolbox() {
    return {
      title: 'Bible Ref',
      icon: icons.bibleReference,
    };
  }

  public static get isReadOnlySupported() {
    return true;
  }

  public static get sanitize(): SanitizerConfig {
    return {
      text: true,
      references: false,
    };
  }

  public render(): HTMLDivElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'bible-reference-tool';

    if (this.readOnly) {
      this.renderReadOnly();
      return this.wrapper;
    }

    this.renderEditable();
    return this.wrapper;
  }

  private renderEditable(): void {
    const label = document.createElement('div');
    label.className = 'bible-reference-tool__label';
    label.textContent = 'Type text with references in braces, e.g. {Luke 1:3}';

    this.headerEl = document.createElement('button');
    this.headerEl.type = 'button';
    this.headerEl.className = 'bible-reference-tool__header';

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'bible-reference-tool__body';

    this.textArea = document.createElement('textarea');
    this.textArea.className = 'bible-reference-tool__textarea';
    this.textArea.value = this.data.text;
    this.textArea.placeholder = 'Type paragraph text here and add references like {Luke 1:3}';
    this.textArea.addEventListener('input', () => {
      this.data.text = this.textArea.value;
      this.syncReferencesFromText();
      this.renderReferenceEditors();
      this.renderPreview();
    });

    this.refsWrap = document.createElement('div');
    this.refsWrap.className = 'bible-reference-tool__refs';

    this.previewWrap = document.createElement('div');
    this.previewWrap.className = 'bible-reference-tool__preview';

    this.popupOverlay = this.createPopup();

    this.wrapper.appendChild(label);
    this.wrapper.appendChild(this.textArea);
    this.wrapper.appendChild(this.refsWrap);
    this.wrapper.appendChild(this.previewWrap);
    this.wrapper.appendChild(this.popupOverlay);

    this.syncReferencesFromText();
    this.renderReferenceEditors();
    this.renderPreview();
  }

  private renderReadOnly(): void {
    this.previewWrap = document.createElement('div');
    this.previewWrap.className =
      'bible-reference-tool__preview ' + 'bible-reference-tool__preview--readonly';

    this.popupOverlay = this.createPopup();

    this.wrapper.appendChild(this.previewWrap);
    this.wrapper.appendChild(this.popupOverlay);

    this.renderPreview();
  }

  private syncReferencesFromText(): void {
    const markers = this.extractMarkers(this.data.text);
    const existingByMarker = new Map<string, BibleReferenceItem>();

    this.data.references.forEach((ref) => {
      if (ref.marker) {
        existingByMarker.set(ref.marker, ref);
      }
    });

    this.data.references = markers.map((marker) => {
      const existing = existingByMarker.get(marker);
      if (existing) {
        return existing;
      }

      return {
        id: this.makeId(),
        marker,
        label: marker,
        passage: '',
      };
    });
  }
  private renderReferenceEditors(): void {
    this.refsWrap.innerHTML = '';

    if (!this.data.references.length) {
      const empty = document.createElement('div');
      empty.className = 'bible-reference-tool__empty';
      empty.textContent = 'No references detected yet.';
      this.refsWrap.appendChild(empty);
      return;
    }

    this.data.references.forEach((ref) => {
      const row = document.createElement('div');
      row.className = 'bible-reference-tool__ref-row';

      const markerEl = document.createElement('div');
      markerEl.className = 'bible-reference-tool__ref-heading';
      markerEl.textContent = `Marker found: {${ref.marker}}`;

      const searchEl = document.createElement('div');
      searchEl.className = 'bible-reference-tool__search-ref';
      searchEl.textContent = `Search reference: ${ref.marker}`;

      const statusEl = document.createElement('div');
      statusEl.className = 'bible-reference-tool__status';
      statusEl.dataset.state = ref.passage ? 'success' : 'info';
      statusEl.textContent = ref.passage ? 'Status: Loaded' : 'Status: Not loaded';

      const buttonRow = document.createElement('div');
      buttonRow.className = 'bible-reference-tool__button-row';

      const loadButton = document.createElement('button');
      loadButton.type = 'button';
      loadButton.className = 'bible-reference-tool__button';
      loadButton.textContent = ref.passage ? 'Reload Bible Ref' : 'Load Bible Ref';
      buttonRow.appendChild(loadButton);

      const previewLabel = document.createElement('div');
      previewLabel.className = 'bible-reference-tool__preview-label';
      previewLabel.textContent = 'Preview';

      const passagePreview = document.createElement('div');
      passagePreview.className = 'bible-reference-tool__passage-preview';
      passagePreview.innerHTML = ref.passage || '';

      if (!ref.passage) {
        passagePreview.textContent = 'No Bible text loaded yet.';
        passagePreview.dataset.empty = 'true';
      }

      loadButton.addEventListener('click', () => {
        void this.loadReference(ref, statusEl, loadButton, passagePreview);
      });

      row.appendChild(markerEl);
      row.appendChild(searchEl);
      row.appendChild(statusEl);
      row.appendChild(buttonRow);
      row.appendChild(previewLabel);
      row.appendChild(passagePreview);

      this.refsWrap.appendChild(row);
    });
  }

  private async loadReference(
    ref: BibleReferenceItem,
    statusEl: HTMLDivElement,
    loadButton: HTMLButtonElement,
    passagePreview: HTMLDivElement,
  ): Promise<void> {
    if (!ref.marker.trim()) {
      statusEl.dataset.state = 'error';
      statusEl.textContent = 'Status: No reference to load';
      return;
    }

    loadButton.disabled = true;
    loadButton.textContent = 'Loading...';
    statusEl.dataset.state = 'info';
    statusEl.textContent = `Status: Loading ${ref.marker}`;

    try {
      const passage = await fetchBiblePassage(ref.marker, this.config);

      if (!passage) {
        throw new Error('No passage text returned from API');
      }

      ref.passage = passage;
      if (!ref.label.trim()) {
        ref.label = ref.marker;
      }

      passagePreview.innerHTML = ref.passage;
      delete passagePreview.dataset.empty;

      loadButton.textContent = 'Reload Bible Ref';
      statusEl.dataset.state = 'success';
      statusEl.textContent = 'Status: Loaded';

      this.renderPreview();
    } catch (err) {
      console.error('Bible reference fetch failed:', err);
      statusEl.dataset.state = 'error';
      statusEl.textContent = 'Status: Could not load reference';
      loadButton.textContent = 'Load Bible Ref';
    } finally {
      loadButton.disabled = false;
    }
  }

  private renderPreview(): void {
    this.previewWrap.innerHTML = '';

    const paragraph = document.createElement('p');
    paragraph.className = 'bible-reference-tool__rendered';

    const fragments = this.parseTextWithMarkers(this.data.text);

    fragments.forEach((fragment) => {
      if (fragment.type === 'text') {
        paragraph.appendChild(document.createTextNode(fragment.value));
        return;
      }

      const ref = this.data.references.find((item) => item.marker === fragment.value);

      if (!ref) {
        paragraph.appendChild(document.createTextNode('{' + fragment.value + '}'));
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bible-reference-tool__inline-ref';
      button.textContent = ref.label || ref.marker;
      button.addEventListener('click', () => {
        this.openPopup(ref);
      });

      paragraph.appendChild(button);
    });

    this.previewWrap.appendChild(paragraph);
  }

  private parseTextWithMarkers(
    text: string,
  ): Array<{ type: 'text'; value: string } | { type: 'marker'; value: string }> {
    const result: Array<{ type: 'text'; value: string } | { type: 'marker'; value: string }> = [];

    const regex = /\{([^}]+)\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null = null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          value: text.slice(lastIndex, match.index),
        });
      }

      const markerText = match[1];

      if (markerText === undefined) {
        continue;
      }

      result.push({
        type: 'marker',
        value: markerText.trim(),
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        value: text.slice(lastIndex),
      });
    }

    return result;
  }

  private extractMarkers(text: string): string[] {
    const regex = /\{([^}]+)\}/g;
    const found: string[] = [];
    const used = new Set<string>();
    let match: RegExpExecArray | null = null;

    while ((match = regex.exec(text)) !== null) {
      const markerText = match[1];

      if (markerText === undefined) {
        continue;
      }

      const marker = markerText.trim();

      if (marker && !used.has(marker)) {
        used.add(marker);
        found.push(marker);
      }
    }

    return found;
  }

  private createPopup(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'bible-reference-tool__popup-overlay';
    overlay.hidden = true;

    const card = document.createElement('div');
    card.className = 'bible-reference-tool__popup-card';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'bible-reference-tool__popup-close';
    close.textContent = '×';
    close.addEventListener('click', () => {
      this.closePopup();
    });

    const body = document.createElement('div');
    body.className = 'bible-reference-tool__popup-body';
    this.popupBody = body;

    card.appendChild(close);
    card.appendChild(body);
    overlay.appendChild(card);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        this.closePopup();
      }
    });

    return overlay;
  }

  private openPopup(ref: BibleReferenceItem): void {
    this.popupBody.innerHTML = '';

    const heading = document.createElement('div');
    heading.className = 'bible-reference-tool__popup-title';
    heading.textContent = ref.label || ref.marker;

    const passage = document.createElement('div');
    passage.className = 'bible-reference-tool__popup-text';
    passage.innerHTML = ref.passage || 'No passage text saved yet.';

    this.popupBody.appendChild(heading);
    this.popupBody.appendChild(passage);

    this.popupOverlay.hidden = false;
  }

  private closePopup(): void {
    this.popupOverlay.hidden = true;
  }

  public save(): BibleReferenceToolData {
    if (!this.readOnly && this.textArea) {
      this.data.text = this.textArea.value;
      this.syncReferencesFromText();
    }

    return {
      text: this.data.text.trim(),
      references: this.data.references.map((ref) => ({
        id: ref.id,
        marker: ref.marker,
        label: ref.label,
        passage: ref.passage,
      })),
      isOpen: this.data.isOpen,
    };
  }

  private makeId(): string {
    return 'ref_' + Math.random().toString(36).slice(2, 10);
  }
}
