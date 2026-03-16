<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';

import DeveloperPanel from '../components/editor/DeveloperPanel.vue';
import EditorHost from '../components/editor/EditorHost.vue';
import InsertPanel from '../components/editor/InsertPanel.vue';
import { languageOptions, type LanguageCode } from 'src/i18n';
import { getCurrentLanguage, setCurrentLanguage } from 'src/i18n/languageState';
import { getTemplatesByLanguage, loadTemplateFile } from '../templates';

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
  clear: () => Promise<void>;
  insertBlock: (type: string, data?: Record<string, unknown>) => Promise<void>;
  render: (output: OutputData) => Promise<void>;
  save: () => Promise<OutputData | null>;
};

const showDeveloperPanel = ref(false);
const STORAGE_KEY = 'editorjs-demo-content';

const currentLang = ref<LanguageCode>(getCurrentLanguage());
const output = ref<OutputData>(loadInitialData() ?? getEmptyOutput());
const editorHost = useTemplateRef<EditorHostExposed>('editorHost');

function getEmptyOutput(): OutputData {
  return {
    blocks: [],
    time: Date.now(),
    version: '2.31.4',
  };
}

function loadInitialData(): OutputData | undefined {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as OutputData;
  } catch {
    return undefined;
  }
}

const templates = computed(() => {
  return getTemplatesByLanguage(currentLang.value);
});

const selectedTemplateKey = ref('');

watch(
  templates,
  (items) => {
    if (!items.length) {
      selectedTemplateKey.value = '';
      return;
    }

    const exists = items.some((item) => {
      return item.key === selectedTemplateKey.value;
    });

    if (!exists) {
      const firstItem = items[0];

      if (firstItem) {
        selectedTemplateKey.value = firstItem.key;
      }
    }
  },
  { immediate: true },
);

watch(currentLang, (value) => {
  setCurrentLanguage(value);
});

async function onInsertBlock(type: string, initialData?: Record<string, unknown>): Promise<void> {
  if (!editorHost.value) {
    return;
  }

  await editorHost.value.insertBlock(type, initialData);
}

async function onLoadTemplate(): Promise<void> {
  if (!selectedTemplateKey.value) {
    return;
  }

  const templateFile = await loadTemplateFile(selectedTemplateKey.value, currentLang.value);

  if (!templateFile) {
    return;
  }

  const nextOutput: OutputData = {
    time: Date.now(),
    version: '2.31.4',
    blocks: templateFile.blocks,
  };

  output.value = nextOutput;

  if (editorHost.value) {
    await editorHost.value.render(nextOutput);
  }
}

async function onSave(): Promise<void> {
  if (!editorHost.value) {
    return;
  }

  const saved = await editorHost.value.save();

  if (!saved) {
    return;
  }

  output.value = saved;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

async function onClear(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);

  const cleared = getEmptyOutput();
  output.value = cleared;

  if (editorHost.value) {
    await editorHost.value.clear();
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="topbar__left">
        <h1>Editor.js Editor</h1>
      </div>

      <div class="topbar__right">
        <label class="field-group">
          <span>Language</span>
          <select v-model="currentLang">
            <option v-for="option in languageOptions" :key="option.code" :value="option.code">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="field-group">
          <span>Template</span>
          <select v-model="selectedTemplateKey">
            <option v-for="template in templates" :key="template.key" :value="template.key">
              {{ template.label }}
            </option>
          </select>
        </label>

        <div class="actions">
          <button id="btn-load-template" type="button" @click="onLoadTemplate">
            Load Template
          </button>

          <button id="btn-save" type="button" @click="onSave">Save</button>

          <button id="btn-clear" type="button" @click="onClear">Clear</button>

          <button
            id="btn-toggle-json"
            type="button"
            @click="showDeveloperPanel = !showDeveloperPanel"
          >
            {{ showDeveloperPanel ? 'Hide JSON' : 'Show JSON' }}
          </button>
        </div>
      </div>
    </header>

    <main
      class="layout"
      :class="{
        'layout--with-json': showDeveloperPanel,
      }"
    >
      <section class="panel panel--editor">
        <h2>Editor</h2>

        <EditorHost ref="editorHost" v-model="output" :lang="currentLang" />

        <p class="hint">Tip: add a block from the panel on the right.</p>
      </section>

      <InsertPanel @insert="onInsertBlock" />

      <DeveloperPanel v-if="showDeveloperPanel" :output="output" />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  max-width: 1520px;
  margin: 0 auto;
  padding: 24px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.topbar__left {
  flex: 0 0 auto;
}

.topbar__left h1 {
  margin: 0;
}

.topbar__right {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group span {
  font-size: 0.9rem;
  font-weight: 600;
}

.field-group select {
  min-width: 180px;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: start;
}

.layout--with-json {
  grid-template-columns: minmax(0, 1fr) 280px 360px;
}

.panel {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 12px;
  padding: 20px;
}

.panel--editor {
  min-width: 0;
}

.panel h2 {
  margin-top: 0;
}

.hint {
  margin-top: 16px;
  color: #666666;
}

@media (max-width: 1100px) {
  .layout,
  .layout--with-json {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .topbar {
    align-items: stretch;
  }

  .topbar__right {
    justify-content: flex-start;
  }
}
</style>
