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
  private expandedRefs = new Set<string>();
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

    this.data.references.forEach((ref) => {
      if (!ref.passage) {
        this.expandedRefs.add(ref.id);
      }
    });
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
    this.syncReferencesFromText();
    this.renderEditableView();
  }

  private renderEditableView(): void {
    this.wrapper.innerHTML = '';

    const topBar = document.createElement('div');
    topBar.className = 'bible-reference-tool__topbar';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'bible-reference-tool__toggle';

    if (this.data.isOpen) {
      toggleButton.classList.add('bible-reference-tool__toggle--button');
      toggleButton.textContent = 'Collapse';
      toggleButton.addEventListener('click', () => {
        this.collapseEditor();
      });
    } else {
      toggleButton.classList.add('bible-reference-tool__toggle--link');
      toggleButton.textContent = 'Edit';
      toggleButton.addEventListener('click', () => {
        this.openEditor();
      });
    }

    topBar.appendChild(toggleButton);
    this.wrapper.appendChild(topBar);

    this.previewWrap = document.createElement('div');
    this.previewWrap.className = 'bible-reference-tool__preview';
    this.wrapper.appendChild(this.previewWrap);
    this.renderPreview();

    if (this.data.isOpen) {
      this.textArea = document.createElement('textarea');
      this.textArea.className = 'bible-reference-tool__textarea';
      this.textArea.value = this.data.text;
      this.textArea.placeholder = 'Type paragraph text here and add references like {Luke 1:3}';
      this.textArea.addEventListener('input', () => {
        this.data.text = this.textArea.value;
        this.syncReferencesFromText();
        this.renderPreview();
        this.renderReferenceEditors();
      });

      this.refsWrap = document.createElement('div');
      this.refsWrap.className = 'bible-reference-tool__refs';
      this.wrapper.appendChild(this.textArea);
      const label = document.createElement('div');
      label.className = 'bible-reference-tool__label';
      label.textContent = 'Use braces for references, for example {Luke 1:3}.';
      this.wrapper.appendChild(label);

      this.wrapper.appendChild(this.refsWrap);

      this.renderReferenceEditors();
    }

    this.popupOverlay = this.createPopup();
    this.wrapper.appendChild(this.popupOverlay);
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

  private openEditor(): void {
    this.data.isOpen = true;
    this.renderEditableView();
  }

  private collapseEditor(): void {
    this.data.isOpen = false;
    this.renderEditableView();
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

      const ref = {
        id: this.makeId(),
        marker,
        label: marker,
        passage: '',
      };

      this.expandedRefs.add(ref.id);
      return ref;
    });

    const validIds = new Set(this.data.references.map((ref) => ref.id));
    this.expandedRefs.forEach((id) => {
      if (!validIds.has(id)) {
        this.expandedRefs.delete(id);
      }
    });
  }

  private isReferenceExpanded(ref: BibleReferenceItem): boolean {
    return this.expandedRefs.has(ref.id);
  }

  private expandReference(ref: BibleReferenceItem): void {
    this.expandedRefs.add(ref.id);
    this.renderReferenceEditors();
  }

  private collapseReference(ref: BibleReferenceItem): void {
    this.expandedRefs.delete(ref.id);
    this.renderReferenceEditors();
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
      const expanded = this.isReferenceExpanded(ref);

      const row = document.createElement('div');
      row.className = 'bible-reference-tool__ref-row';

      const summary = document.createElement('div');
      summary.className = 'bible-reference-tool__ref-summary';

      const markerEl = document.createElement('div');
      markerEl.className = 'bible-reference-tool__ref-heading';
      markerEl.textContent = `Marker found: {${ref.marker}}`;

      const detailsButton = document.createElement('button');
      detailsButton.type = 'button';
      detailsButton.className = 'bible-reference-tool__details-button';
      detailsButton.textContent = expanded ? 'Hide' : 'Details';
      detailsButton.addEventListener('click', () => {
        if (expanded) {
          this.collapseReference(ref);
          return;
        }

        this.expandReference(ref);
      });

      summary.appendChild(markerEl);
      summary.appendChild(detailsButton);
      row.appendChild(summary);

      if (expanded) {
        const statusEl = document.createElement('div');
        statusEl.className = 'bible-reference-tool__status';
        statusEl.dataset.state = ref.passage ? 'success' : 'info';
        statusEl.textContent = ref.passage ? 'Status: Loaded' : 'Status: Not loaded';

        const buttonRow = document.createElement('div');
        buttonRow.className = 'bible-reference-tool__button-row';

        const loadButton = document.createElement('button');
        loadButton.type = 'button';
        loadButton.className = 'bible-reference-tool__button';

        if (ref.passage) {
          loadButton.classList.add('bible-reference-tool__button--secondary');
          loadButton.textContent = 'Reload Bible Ref';
        } else {
          loadButton.classList.add('bible-reference-tool__button--primary');
          loadButton.textContent = 'Load Bible Ref';
        }

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
        } else {
          delete passagePreview.dataset.empty;
        }

        loadButton.addEventListener('click', () => {
          void this.loadReference(ref, statusEl, loadButton, passagePreview);
        });

        row.appendChild(statusEl);
        row.appendChild(buttonRow);
        row.appendChild(previewLabel);
        row.appendChild(passagePreview);
      }

      this.refsWrap.appendChild(row);
    });
  }

  private validateMarker(marker: string): string | null {
    const trimmed = marker.trim();

    if (!trimmed) {
      return 'No reference to load';
    }

    if (trimmed.includes(',')) {
      return (
        'Multiple non-contiguous verses are not supported yet. ' +
        'Please enter a single verse or a continuous range, ' +
        'for example John 3:16 or John 3:16-18.'
      );
    }

    return null;
  }

  private async loadReference(
    ref: BibleReferenceItem,
    statusEl: HTMLDivElement,
    loadButton: HTMLButtonElement,
    passagePreview: HTMLDivElement,
  ): Promise<void> {
    const validationError = this.validateMarker(ref.marker);

    if (validationError) {
      this.expandedRefs.add(ref.id);
      statusEl.dataset.state = 'error';
      statusEl.textContent = `Status: ${validationError}`;
      passagePreview.textContent = 'No Bible text loaded yet.';
      passagePreview.dataset.empty = 'true';
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

      statusEl.dataset.state = 'success';
      statusEl.textContent = 'Status: Loaded';

      loadButton.className =
        'bible-reference-tool__button ' + 'bible-reference-tool__button--secondary';
      loadButton.textContent = 'Reload Bible Ref';

      this.renderPreview();
    } catch (err) {
      console.error('Bible reference fetch failed:', err);
      this.expandedRefs.add(ref.id);
      statusEl.dataset.state = 'error';
      statusEl.textContent = 'Status: Could not load reference';
      loadButton.className =
        'bible-reference-tool__button ' + 'bible-reference-tool__button--primary';
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
