<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createEditor, type EditorInstance } from '../editor/createEditor';

import type { LanguageCode } from 'src/i18n';

type InsertBlockData = Record<string, unknown>;
type EditorHostSaver = () => void;

type EditorBlockData = {
  id?: string;
  type: string;
  data: Record<string, unknown>;
};

type OutputData = {
  blocks: EditorBlockData[];
  time?: number;
  version?: string;
};

type EditorHostExposed = {
  save: () => Promise<OutputData | null>;
  clear: () => Promise<void>;
  render: (output: OutputData) => Promise<void>;
  insertBlock: (type: string, data?: InsertBlockData) => Promise<void>;
};

const props = defineProps<{
  lang: LanguageCode;
  modelValue?: OutputData;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: OutputData): void;
  (e: 'ready'): void;
}>();

const holderId = 'editorjs-host';
const editorInstance = ref<EditorInstance | null>(null);
const isApplyingExternalData = ref(false);
const lastSavedJson = ref('');
let rootElement: HTMLElement | null = null;

function stableStringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function toPlainOutput(value?: OutputData): OutputData {
  return JSON.parse(JSON.stringify(value || getEmptyOutput())) as OutputData;
}

function getEmptyOutput(): OutputData {
  return {
    blocks: [],
    time: Date.now(),
    version: '2.31.5',
  };
}

async function syncFromEditor(): Promise<OutputData | null> {
  const editor = editorInstance.value;

  if (!editor) {
    return null;
  }

  const output = await editor.save();
  lastSavedJson.value = stableStringify(output);
  emit('update:modelValue', output);

  return output;
}

async function createEditorInstance(): Promise<void> {
  await nextTick();

  const editor = createEditor({
    holder: holderId,
    lang: props.lang,
    ...(props.modelValue !== undefined ? { data: props.modelValue } : {}),
  });

  editorInstance.value = editor;

  await editor.isReady;

  const initialOutput = await editor.save();
  lastSavedJson.value = stableStringify(initialOutput);
  emit('update:modelValue', initialOutput);
  emit('ready');
}

function destroyEditorInstance(): void {
  const editor = editorInstance.value;

  if (!editor) {
    return;
  }

  editor.destroy();
  editorInstance.value = null;
}

async function rebuildEditor(): Promise<void> {
  destroyEditorInstance();
  await createEditorInstance();
}

async function emitSavedOutput(): Promise<void> {
  const editor = editorInstance.value;

  if (!editor || isApplyingExternalData.value) {
    return;
  }

  const output = await editor.save();
  const json = stableStringify(output);

  if (json === lastSavedJson.value) {
    return;
  }

  lastSavedJson.value = json;
  emit('update:modelValue', output);
}

function bindEditorListeners(): void {
  rootElement = document.getElementById(holderId);

  if (!rootElement) {
    return;
  }

  const saver: EditorHostSaver = () => {
    void emitSavedOutput();
  };

  rootElement.addEventListener('input', saver);
  rootElement.addEventListener('focusout', saver);

  (
    rootElement as HTMLElement & {
      __editorHostSaver__?: EditorHostSaver;
    }
  ).__editorHostSaver__ = saver;
}

function unbindEditorListeners(): void {
  if (!rootElement) {
    return;
  }

  const typedRoot = rootElement as HTMLElement & {
    __editorHostSaver__?: EditorHostSaver;
  };

  if (typedRoot.__editorHostSaver__) {
    rootElement.removeEventListener('input', typedRoot.__editorHostSaver__);
    rootElement.removeEventListener('focusout', typedRoot.__editorHostSaver__);
    delete typedRoot.__editorHostSaver__;
  }

  rootElement = null;
}

onMounted(async () => {
  await createEditorInstance();
  bindEditorListeners();
});

onBeforeUnmount(() => {
  unbindEditorListeners();
  destroyEditorInstance();
});

watch(
  () => props.lang,
  async () => {
    unbindEditorListeners();
    await rebuildEditor();
    bindEditorListeners();
  },
);

watch(
  () => props.modelValue,
  async (newValue) => {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    const incomingJson = stableStringify(newValue);

    if (incomingJson === lastSavedJson.value) {
      return;
    }

    isApplyingExternalData.value = true;

    try {
      const plainOutput = toPlainOutput(newValue);
      await editor.render(plainOutput);

      const saved = await editor.save();
      lastSavedJson.value = stableStringify(saved);
    } finally {
      isApplyingExternalData.value = false;
    }
  },
  { deep: true },
);
const exposed: EditorHostExposed = {
  save: async () => {
    return syncFromEditor();
  },

  clear: async () => {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    editor.clear();
    await syncFromEditor();
  },

  render: async (output: OutputData) => {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    isApplyingExternalData.value = true;

    try {
      const plainOutput = toPlainOutput(output);
      await editor.render(plainOutput);
      await syncFromEditor();
    } finally {
      isApplyingExternalData.value = false;
    }
  },

  insertBlock: async (type: string, data?: InsertBlockData) => {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    editor.blocks.insert(type, data || {}, undefined, undefined, true);

    await syncFromEditor();
  },
};

defineExpose(exposed);
</script>
<template>
  <div :id="holderId"></div>
</template>
<style scoped>
:deep(.codex-editor) {
  width: 100%;
}

:deep(.codex-editor__redactor) {
  padding-bottom: 120px !important;
}

/* Let block content use the full editor width */
:deep(.ce-block__content),
:deep(.ce-toolbar__content) {
  max-width: none;
  margin-left: 0;
  margin-right: 0;
}

/* Reserve a protected strip on the right for block actions */
:deep(.ce-block) {
  padding-inline-end: 88px;
  box-sizing: border-box;
}

/* Keep inner block content inside its box */
:deep(.ce-block__content) {
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

/* Media must not spill into the action area */
:deep(.ce-block img),
:deep(.ce-block video),
:deep(.ce-block iframe),
:deep(.ce-block canvas) {
  display: block;
  max-width: 100%;
  height: auto;
  box-sizing: border-box;
}

/* Keep the toolbar on the right */
:deep(.ce-toolbar) {
  left: auto !important;
  right: 16px;
}

:deep(.ce-toolbar__plus) {
  left: auto !important;
  right: 0;
}

:deep(.ce-toolbar__settings-btn) {
  right: 0;
}

/* Make sure the settings menu stays above block content */
:deep(.ce-settings) {
  z-index: 30;
}

:deep(.ce-popover__items) {
  max-height: 60vh;
  overflow-y: auto;
}

:deep(.ce-toolbox) {
  z-index: 9999;
}
</style>
