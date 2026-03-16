<script setup lang="ts">
import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

import { createEditor } from "../../editor/createEditor";
import type { LanguageCode } from "../../i18n";

type InsertBlockData = Record<string, unknown>;

const props = defineProps<{
  lang: LanguageCode;
  modelValue?: OutputData;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: OutputData): void;
  (e: "ready"): void;
}>();




const holderId = "editorjs-host";
const editorInstance = ref<EditorJS | null>(null);
const isApplyingExternalData = ref(false);
const lastSavedJson = ref("");
let rootElement: HTMLElement | null = null;

function stableStringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function getEmptyOutput(): OutputData {
  return {
    blocks: [],
    time: Date.now(),
    version: "2.31.4",
  };
}

async function syncFromEditor(): Promise<OutputData | null> {
  const editor = editorInstance.value;

  if (!editor) {
    return null;
  }

  const output = await editor.save();
  lastSavedJson.value = stableStringify(output);
  emit("update:modelValue", output);

  return output;
}

async function createEditorInstance(): Promise<void> {
  await nextTick();

  const editor = createEditor({
    holder: holderId,
    data: props.modelValue,
    lang: props.lang,
  });

  editorInstance.value = editor;

  await editor.isReady;

  const initialOutput = await editor.save();
  lastSavedJson.value = stableStringify(initialOutput);
  emit("update:modelValue", initialOutput);
  emit("ready");
}

async function destroyEditorInstance(): Promise<void> {
  const editor = editorInstance.value;

  if (!editor) {
    return;
  }

  editor.destroy();
  editorInstance.value = null;
}

async function rebuildEditor(): Promise<void> {
  await destroyEditorInstance();
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
  emit("update:modelValue", output);
}

function bindEditorListeners(): void {
  rootElement = document.getElementById(holderId);

  if (!rootElement) {
    return;
  }

  const saver = async () => {
    await emitSavedOutput();
  };

  rootElement.addEventListener("input", saver);
  rootElement.addEventListener("focusout", saver);

  (rootElement as HTMLElement & {
    __editorHostSaver__?: () => Promise<void>;
  }).__editorHostSaver__ = saver;
}

function unbindEditorListeners(): void {
  if (!rootElement) {
    return;
  }

  const typedRoot = rootElement as HTMLElement & {
    __editorHostSaver__?: () => Promise<void>;
  };

  if (typedRoot.__editorHostSaver__) {
    rootElement.removeEventListener("input", typedRoot.__editorHostSaver__);
    rootElement.removeEventListener(
      "focusout",
      typedRoot.__editorHostSaver__
    );
    delete typedRoot.__editorHostSaver__;
  }

  rootElement = null;
}

onMounted(async () => {
  await createEditorInstance();
  bindEditorListeners();
});

onBeforeUnmount(async () => {
  unbindEditorListeners();
  await destroyEditorInstance();
});

watch(
  () => props.lang,
  async () => {
    unbindEditorListeners();
    await rebuildEditor();
    bindEditorListeners();
  }
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
  { deep: true }
);

defineExpose({
  async save(): Promise<OutputData | null> {
    return await syncFromEditor();
  },

  async clear(): Promise<void> {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    await editor.clear();
    await syncFromEditor();
  },

  async render(output: OutputData): Promise<void> {
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

  async insertBlock(
    type: string,
    data?: InsertBlockData
  ): Promise<void> {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    await editor.blocks.insert(
      type,
      data || {},
      undefined,
      undefined,
      true
    );

    await syncFromEditor();
  },
});
</script>

<template>
  <div :id="holderId" class="editor-host"></div>
</template>

<style scoped>
.editor-host {
  min-height: 500px;
}
</style>