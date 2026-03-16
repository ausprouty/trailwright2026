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

function getEmptyOutput(): OutputData {
  return {
    blocks: [],
    time: Date.now(),
    version: '2.31.4',
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
      await editor.render(newValue || getEmptyOutput());

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
      await editor.render(output);
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
