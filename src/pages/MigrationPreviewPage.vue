<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

type PreviewBlock = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

type PreviewContent = {
  time: number;
  version: string;
  blocks: PreviewBlock[];
};

const content = ref<PreviewContent | null>(null);
const loading = ref(true);
const errorMessage = ref('');

async function loadPreview(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch('/migration-preview/life202.json', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Preview JSON not found: ${response.status}`);
    }

    const json = (await response.json()) as PreviewContent;
    content.value = json;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
}

const prettyJson = computed((): string => {
  return content.value ? JSON.stringify(content.value, null, 2) : '';
});

function getRawHtml(data: Record<string, unknown>): string {
  const html = data.html;

  return typeof html === 'string' ? html : '';
}

onMounted(loadPreview);
</script>

<template>
  <q-page class="migration-preview-page">
    <div class="migration-preview-page__inner">
      <div class="migration-preview-page__header">
        <h1>Migration Preview: life202</h1>
        <q-btn color="primary" label="Reload" @click="loadPreview" />
      </div>

      <div v-if="loading" class="migration-preview-page__message">Loading preview…</div>

      <div v-else-if="errorMessage" class="migration-preview-page__message">
        {{ errorMessage }}
      </div>

      <div v-else class="migration-preview-page__grid">
        <section class="migration-preview-page__panel">
          <h2>Generated JSON</h2>
          <pre>{{ prettyJson }}</pre>
        </section>

        <section class="migration-preview-page__panel">
          <h2>Rendered Preview</h2>

          <!--
            Replace this block with your real renderer if you already
            have one, such as a ContentRenderer component.
          -->
          <div v-if="content">
            <div
              v-for="block in content.blocks"
              :key="block.id"
              class="migration-preview-page__block"
            >
              <div v-if="block.type === 'raw'" v-html="getRawHtml(block.data)" />
              <pre v-else>{{ block }}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.migration-preview-page {
  padding: 24px;
}

.migration-preview-page__inner {
  max-width: 1600px;
  margin: 0 auto;
}

.migration-preview-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.migration-preview-page__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.migration-preview-page__panel {
  border: 1px solid #d7d2cc;
  border-radius: 12px;
  background: #fff;
  padding: 16px;
  overflow: auto;
  min-height: 70vh;
}

.migration-preview-page__panel pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
}

.migration-preview-page__block {
  margin-bottom: 16px;
}

.migration-preview-page__message {
  padding: 24px;
}
</style>
