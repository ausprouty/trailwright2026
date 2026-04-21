<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import EditorJsContent from 'src/components/content/EditorJsContent.vue';
import type { EditorJsContent as EditorJsContentData } from 'src/types/content/EditorBlocks';
import { resolveSharedBlockComponent } from 'src/components/content/shared/resolveSharedBlockComponent';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const series = computed(() => String(route.params.series || 'life'));
const lesson = computed(() => String(route.params.lesson || 'life201'));
const previewJsonUrl = computed(() => {
  return `/migration-preview/myfriends/AU/eng/${series.value}/${lesson.value}.json`;
});
const liveLessonUrl = computed(() => {
  return `https://myfriends.network/content/AU/eng/${series.value}/${lesson.value}.html`;
});
const content = ref<EditorJsContentData | null>(null);
const loading = ref(true);
const errorMessage = ref('');

async function loadPreview(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';

  try {
    console.log('Fetching preview JSON from:', previewJsonUrl.value);
    const response = await fetch(previewJsonUrl.value, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Preview JSON not found: ${response.status}`);
    }

    content.value = (await response.json()) as EditorJsContentData;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
}

const prettyJson = computed((): string => {
  return content.value ? JSON.stringify(content.value, null, 2) : '';
});
function parseLessonNumber(code: string): number | null {
  const match = code.match(/^([a-z]+)(\d+)$/i);

  if (!match) {
    return null;
  }

  return Number(match[2]);
}

function parseLessonPrefix(code: string): string {
  const match = code.match(/^([a-z]+)(\d+)$/i);

  if (!match || !match[1]) {
    return 'life';
  }

  return match[1];
}

function goToLesson(number: number): void {
  const prefix = parseLessonPrefix(lesson.value);

  void router.push({
    path: `/migration-preview/${series.value}/${prefix}${number}`,
  });
}

function goPrevious(): void {
  const number = parseLessonNumber(lesson.value);

  if (number && number > 1) {
    goToLesson(number - 1);
  }
}

function goNext(): void {
  const number = parseLessonNumber(lesson.value);

  if (number) {
    goToLesson(number + 1);
  }
}
watch(
  () => [series.value, lesson.value],
  () => {
    void loadPreview();
  },
);

onMounted(() => {
  void loadPreview();
});
</script>

<template>
  <q-page class="migration-preview-page">
    <div class="migration-preview-page__inner">
      <div class="migration-preview-page__header">
        <div class="migration-preview-page__title">Migration Preview: {{ lesson }}</div>

        <div class="migration-preview-page__actions">
          <q-btn dense label="Prev" @click="goPrevious" />
          <q-btn dense label="Next" @click="goNext" />
          <q-btn dense color="primary" label="Reload" @click="loadPreview" />
        </div>
      </div>

      <div v-if="loading" class="migration-preview-page__message">Loading preview…</div>

      <div v-else-if="errorMessage" class="migration-preview-page__message">
        {{ errorMessage }}
      </div>

      <div v-else class="migration-preview-page__grid">
        <section class="migration-preview-page__panel">
          <h4>Generated JSON</h4>
          <pre>{{ prettyJson }}</pre>
        </section>

        <section class="migration-preview-page__panel">
          <h4>Rendered Preview</h4>

          <EditorJsContent
            v-if="content"
            :content="content"
            :resolve-block-component="resolveSharedBlockComponent"
          />
        </section>

        <section class="migration-preview-page__panel">
          <h4>Live Website</h4>

          <iframe :src="liveLessonUrl" class="migration-preview-page__iframe" />
        </section>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.migration-preview-page {
  padding: 12px 16px;
}

.migration-preview-page__inner {
  max-width: 1800px;
  margin: 0 auto;
}

.migration-preview-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.migration-preview-page__title {
  font-size: 1.25rem;
  font-weight: 500;
}

.migration-preview-page__actions {
  display: flex;
  gap: 8px;
}

.migration-preview-page__grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.migration-preview-page__panel {
  border: 1px solid #d7d2cc;
  border-radius: 12px;
  background: #fff;
  padding: 16px;
  overflow: auto;
  min-height: 80vh;
}

.migration-preview-page__panel pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
}

.migration-preview-page__iframe {
  width: 100%;
  min-height: 75vh;
  border: 0;
  background: #fff;
}

.migration-preview-page__message {
  padding: 24px;
}
</style>
