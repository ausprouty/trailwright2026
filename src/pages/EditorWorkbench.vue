<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import trailWrightImage from 'src/assets/TrailWright.webp';

import DeveloperPanel from '../components/editor/DeveloperPanel.vue';
import EditorHost from '../components/editor/EditorHost.vue';
import InsertPanel from '../components/editor/InsertPanel.vue';
import { languageOptions, type LanguageCode } from 'src/i18n';
import { getCurrentLanguage, setCurrentLanguage } from 'src/i18n/languageState';
import {
  fetchTemplateList,
  fetchTemplateContent,
  saveTemplateContent,
  type TemplateListItem,
} from 'src/services/templateService';

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
const templates = ref<TemplateListItem[]>([]);
const selectedTemplateKey = ref('');

const heroStyle = computed(() => ({
  backgroundImage: `linear-gradient(
      rgba(43, 29, 18, 0.45),
      rgba(43, 29, 18, 0.62)
    ), url(${trailWrightImage})`,
}));

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

async function refreshTemplates(lang: LanguageCode): Promise<void> {
  try {
    const fetchedTemplates = await fetchTemplateList(lang);
    templates.value = fetchedTemplates;

    const hasSelectedTemplate = fetchedTemplates.some(
      (template) => template.key === selectedTemplateKey.value,
    );

    if (!hasSelectedTemplate) {
      const firstTemplate = fetchedTemplates[0];
      selectedTemplateKey.value = firstTemplate ? firstTemplate.key : '';
    }
  } catch (error) {
    console.error('Failed to load template list', error);
    templates.value = [];
    selectedTemplateKey.value = '';
  }
}

function askTemplateFileName(): string | null {
  const templatePart = selectedTemplateKey.value || 'document';
  const suggested = templatePart.replace(/\.json$/i, '');

  const response = window.prompt('Save template as:', suggested);

  if (response === null) {
    return null;
  }

  const safeName = response
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');

  if (!safeName) {
    window.alert('Please enter a valid file name.');
    return null;
  }

  return safeName;
}

watch(
  currentLang,
  async (lang) => {
    setCurrentLanguage(lang);
    await refreshTemplates(lang);
  },
  { immediate: true },
);

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

  const templateFile = await fetchTemplateContent(currentLang.value, selectedTemplateKey.value);

  if (!templateFile) {
    return;
  }

  const nextOutput: OutputData = JSON.parse(
    JSON.stringify({
      time: Date.now(),
      version: '2.31.4',
      blocks: templateFile.blocks,
    }),
  ) as OutputData;

  output.value = nextOutput;
}

function onRetrieveDraft(): void {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return;
  }

  output.value = JSON.parse(raw) as OutputData;
}
async function onSaveDraft(): Promise<void> {
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

async function onSave(): Promise<void> {
  const templateName = askTemplateFileName();

  if (!templateName) {
    return;
  }

  const saved = await editorHost.value?.save();

  if (!saved) {
    return;
  }

  await saveTemplateContent(currentLang.value, templateName, saved);
  await refreshTemplates(currentLang.value);
  selectedTemplateKey.value = templateName;
}

async function onClear(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);

  if (!editorHost.value) {
    output.value = getEmptyOutput();
    return;
  }

  await editorHost.value.clear();
}
</script>

<template>
  <div class="workbench">
    <section class="hero" :style="heroStyle">
      <div class="hero__content">
        <p class="hero__eyebrow">TrailWright</p>
        <h1 class="hero__title">Editor Workspace</h1>
        <p class="hero__subtitle">
          Build, shape, and save lesson content with a calmer writing space.
        </p>
      </div>
    </section>

    <div class="workbench__inner">
      <header class="control-bar">
        <div class="control-bar__title">
          <h2>Editor.js Editor</h2>
          <p>Choose a language, load a template, and begin editing.</p>
        </div>

        <div class="control-bar__controls">
          <label class="field-group">
            <span>Language</span>
            <select v-model="currentLang" class="select-control">
              <option v-for="option in languageOptions" :key="option.code" :value="option.code">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="field-group">
            <span>Template</span>
            <select v-model="selectedTemplateKey" class="select-control">
              <option v-for="template in templates" :key="template.key" :value="template.key">
                {{ template.label }}
              </option>
            </select>
          </label>

          <div class="actions">
            <button
              id="btn-load-template"
              type="button"
              class="button button--primary"
              @click="onLoadTemplate"
            >
              Load Template
            </button>

            <button id="btn-save" type="button" class="button button--secondary" @click="onSave">
              Save
            </button>

            <button
              id="btn-save-draft"
              type="button"
              class="button button--secondary"
              @click="onSaveDraft"
            >
              Save Draft
            </button>

            <button
              id="btn-retrieve-draft"
              type="button"
              class="button button--ghost"
              @click="onRetrieveDraft"
            >
              Retrieve Draft
            </button>

            <button id="btn-clear" type="button" class="button button--ghost" @click="onClear">
              Clear Draft
            </button>

            <button
              id="btn-toggle-json"
              type="button"
              class="button button--ghost"
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
          <EditorHost ref="editorHost" v-model="output" :lang="currentLang" />
        </section>

        <InsertPanel @insert="onInsertBlock" />

        <DeveloperPanel v-if="showDeveloperPanel" :output="output" />
      </main>
    </div>
  </div>
</template>
<style scoped>
.actions {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 10px;
}

.button {
  height: 46px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.button:hover {
  transform: translateY(-1px);
}

.button:active {
  transform: translateY(0);
}

.button--ghost {
  background: rgba(255, 249, 241, 0.72);
  border-color: #ddc3a7;
  color: #6e4320;
}

.button--ghost:hover {
  background: rgba(255, 244, 230, 0.98);
  border-color: #c98d56;
}

.button--primary {
  background: linear-gradient(180deg, #b46c36 0%, #9a5828 100%);
  border-color: #8d4f22;
  box-shadow: 0 6px 14px rgba(160, 90, 44, 0.18);
  color: #fff9f1;
}

.button--primary:hover {
  background: linear-gradient(180deg, #bf7540 0%, #a45f2f 100%);
}

.button--secondary {
  background: linear-gradient(180deg, #fffaf3 0%, #f3e7d8 100%);
  border-color: #d1b08d;
  color: #6e4320;
}

.button--secondary:hover {
  background: linear-gradient(180deg, #fffdf8 0%, #f6ebde 100%);
  border-color: #b77a45;
}

.control-bar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
  padding: 24px 28px;
  background: rgba(255, 252, 247, 0.94);
  border: 1px solid #dcc8ae;
  border-radius: 22px;
  box-shadow: 0 12px 28px rgba(77, 52, 30, 0.08);
  backdrop-filter: blur(4px);
}

.control-bar__controls {
  display: flex;
  align-items: end;
  justify-content: flex-end;
  flex: 1 1 680px;
  flex-wrap: wrap;
  gap: 14px;
}

.control-bar__title {
  min-width: 240px;
  flex: 1 1 320px;
}

.control-bar__title h2 {
  margin: 0;
  color: #5a3415;
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.1;
}

.control-bar__title p {
  margin: 8px 0 0;
  color: #72563e;
  font-size: 0.98rem;
  line-height: 1.45;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-group span {
  color: #7a4c22;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.hero {
  min-height: 240px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 0 0 28px 28px;
  box-shadow: inset 0 -40px 80px rgba(0, 0, 0, 0.12);
}

.hero__content {
  max-width: 1520px;
  margin: 0 auto;
  padding: 42px 24px 58px;
  color: #fff7ec;
}

.hero__eyebrow {
  margin: 0 0 10px;
  color: #f3d9ba;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero__subtitle {
  max-width: 680px;
  margin: 14px 0 0;
  color: rgba(255, 247, 236, 0.92);
  font-size: 1.05rem;
  line-height: 1.5;
}

.hero__title {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  font-weight: 800;
  line-height: 1.02;
}

.hint {
  margin-top: 18px;
  color: #7a624f;
  font-size: 0.96rem;
}

.layout {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
}

.layout--with-json {
  grid-template-columns: minmax(0, 1fr) 340px 360px;
}

.panel {
  padding: 24px;
  background: #fffdf9;
  border: 1px solid #dcc8ae;
  border-radius: 22px;
  box-shadow: 0 10px 24px rgba(77, 52, 30, 0.08);
}

.panel--editor {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 760px;
}

.select-control {
  min-width: 190px;
  height: 46px;
  padding: 0 40px 0 14px;
  appearance: none;
  background-image:
    linear-gradient(180deg, #fffdfa 0%, #f7efe3 100%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%238a4b14' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-position:
    0 0,
    right 12px center;
  background-repeat: no-repeat, no-repeat;
  background-size:
    auto,
    16px 16px;
  border: 1px solid #d8b48d;
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  color: #2f241c;
  font-size: 0.98rem;
  font-weight: 600;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.select-control:hover {
  border-color: #c88345;
  background-image:
    linear-gradient(180deg, #fffefb 0%, #fbf2e6 100%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%238a4b14' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.select-control:focus {
  outline: none;
  border-color: #a05a2c;
  box-shadow: 0 0 0 4px rgba(160, 90, 44, 0.14);
}

.workbench {
  min-height: 100vh;
  background: radial-gradient(circle at top left, #f9f1e5 0%, #f3ece2 38%, #efe7db 100%);
}

.workbench__inner {
  position: relative;
  z-index: 1;
  max-width: 1520px;
  margin: -34px auto 0;
  padding: 0 24px 32px;
}

@media (max-width: 1200px) {
  .control-bar {
    align-items: stretch;
  }

  .control-bar__controls {
    justify-content: flex-start;
  }

  .layout,
  .layout--with-json {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .actions {
    width: 100%;
  }

  .control-bar {
    padding: 20px;
  }

  .field-group {
    width: 100%;
  }

  .hero__content {
    padding: 34px 18px 48px;
  }

  .select-control {
    min-width: 100%;
  }

  .workbench__inner {
    padding: 0 18px 24px;
  }
}
</style>
