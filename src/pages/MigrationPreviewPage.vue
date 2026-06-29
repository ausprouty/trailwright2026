<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import EditorJsContent from 'src/components/content/EditorJsContent.vue';
import { resolveSharedBlockComponent } from 'src/components/content/shared/resolveSharedBlockComponent';
import { useRoute, useRouter } from 'vue-router';
import type { EditorJsContent as EditorJsContentData } from 'src/types/content/EditorBlocks';
import type { AnyEditorJsBlock } from 'src/types/content/MigrationTypes';
import type { NumberSystem } from 'src/utils/localizeDigits';

const route = useRoute();
const router = useRouter();

const site = computed(() => String(route.params.site || 'myfriends'));
const country = computed(() => String(route.params.country || 'AU'));
const language = computed(() => String(route.params.language || 'eng'));
const series = computed(() => String(route.params.series || 'life'));
const lesson = computed(() => String(route.params.lesson || 'life201'));

const previewJsonUrl = computed(() => {
  return `/migration-preview/${site.value}/${country.value}/${language.value}/${series.value}/${lesson.value}.json`;
});

const previewIndexUrl = computed(() => {
  return `/migration-preview/${site.value}/${country.value}/${language.value}/${series.value}/index.json`;
});

const liveLessonUrl = computed(() => {
  return `https://myfriends.network/content/${country.value}/${language.value}/${series.value}/${lesson.value}.html`;
});
const rawLessonUrl = computed(() => {
  return `/migration-raw/${site.value}/${country.value}/${language.value}/${series.value}/${lesson.value}.html`;
});

type LessonPreviewContent = {
  site: string;
  country: string;
  language: string;
  htmlLang: string;
  direction: 'ltr' | 'rtl';
  numberSystem?: NumberSystem;
  series: string;
  lessonId: string;
  sortOrder: number;
  blocks: AnyEditorJsBlock[];
};

const content = ref<LessonPreviewContent | null>(null);

type MigrationPreviewIndex = Record<string, Record<string, string[]>>;
const previewTree = ref<MigrationPreviewIndex>({});
const previewTreeUrl = computed(() => {
  return `/migration-preview/${site.value}/index.json`;
});
async function loadPreviewTree(): Promise<void> {
  try {
    const response = await fetch(previewTreeUrl.value, {
      cache: 'no-store',
    });

    if (!response.ok) {
      previewTree.value = {};
      return;
    }

    const data = (await response.json()) as unknown;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      previewTree.value = data as MigrationPreviewIndex;
      return;
    }

    previewTree.value = {};
  } catch {
    previewTree.value = {};
  }
}
const countryOptions = computed(() => {
  return Object.keys(previewTree.value).map((countryCode) => ({
    label: countryCode,
    value: countryCode,
  }));
});

const languageOptions = computed(() => {
  const languages = previewTree.value[country.value] ?? {};

  return Object.keys(languages).map((languageCode) => ({
    label: languageCode,
    value: languageCode,
  }));
});

const seriesOptions = computed(() => {
  const seriesList = previewTree.value[country.value]?.[language.value] ?? [];

  return seriesList.map((seriesCode) => ({
    label: seriesCode,
    value: seriesCode,
  }));
});

const selectedCountry = computed({
  get: () => country.value,
  set: (targetCountry: string) => {
    const languages = previewTree.value[targetCountry] ?? {};
    const targetLanguage = Object.keys(languages)[0] ?? language.value;
    const targetSeries = languages[targetLanguage]?.[0] ?? series.value;

    void router.push({
      path: `/migration-preview/${site.value}/${targetCountry}/${targetLanguage}/${targetSeries}/${lesson.value}`,
    });
  },
});

const selectedLanguage = computed({
  get: () => language.value,
  set: (targetLanguage: string) => {
    const seriesList = previewTree.value[country.value]?.[targetLanguage] ?? [];
    const targetSeries = seriesList[0] ?? series.value;

    void router.push({
      path: `/migration-preview/${site.value}/${country.value}/${targetLanguage}/${targetSeries}/${lesson.value}`,
    });
  },
});

const selectedSeries = computed({
  get: () => series.value,
  set: (targetSeries: string) => {
    void router.push({
      path: `/migration-preview/${site.value}/${country.value}/${language.value}/${targetSeries}/${lesson.value}`,
    });
  },
});

const editorJsContent = computed<EditorJsContentData | null>(() => {
  if (!content.value) {
    return null;
  }

  return {
    time: Date.now(),
    version: '2.31.0',
    blocks: content.value.blocks,
    numberSystem: content.value.numberSystem ?? 'latn',
  };
});
const loading = ref(true);
const errorMessage = ref('');
const lessonList = ref<string[]>([]);

async function loadLessonList(): Promise<void> {
  try {
    const response = await fetch(previewIndexUrl.value, {
      cache: 'no-store',
    });

    if (!response.ok) {
      lessonList.value = [];
      return;
    }

    const data = (await response.json()) as unknown;

    if (Array.isArray(data)) {
      lessonList.value = data.filter((item): item is string => typeof item === 'string');
      return;
    }

    lessonList.value = [];
  } catch {
    lessonList.value = [];
  }
}
async function loadPreview(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';

  try {
    await loadPreviewTree();
    await loadLessonList();

    console.log('Fetching preview JSON from:', previewJsonUrl.value);

    const response = await fetch(previewJsonUrl.value, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Preview JSON not found: ${response.status}`);
    }

    content.value = (await response.json()) as LessonPreviewContent;
  } catch (error) {
    content.value = null;
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
}

const prettyJson = computed((): string => {
  return content.value ? JSON.stringify(content.value, null, 2) : '';
});

const currentLessonIndex = computed((): number => {
  return lessonList.value.indexOf(lesson.value);
});

const hasPrevious = computed((): boolean => {
  return currentLessonIndex.value > 0;
});

const hasNext = computed((): boolean => {
  return currentLessonIndex.value !== -1 && currentLessonIndex.value < lessonList.value.length - 1;
});

function goToLesson(targetLesson: string): void {
  void router.push({
    path: `/migration-preview/${site.value}/${country.value}/${language.value}/${series.value}/${targetLesson}`,
  });
}

function goPrevious(): void {
  if (!hasPrevious.value) {
    return;
  }

  const targetLesson = lessonList.value[currentLessonIndex.value - 1];

  if (targetLesson) {
    goToLesson(targetLesson);
  }
}

function goNext(): void {
  if (!hasNext.value) {
    return;
  }

  const targetLesson = lessonList.value[currentLessonIndex.value + 1];

  if (targetLesson) {
    goToLesson(targetLesson);
  }
}

watch(
  () => [site.value, country.value, language.value, series.value, lesson.value],
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
        <div class="migration-preview-page__title">
          Migration Preview:
          {{ site }}/{{ country }}/{{ language }}/{{ series }}/{{ lesson }}
        </div>

        <q-select
          v-model="selectedCountry"
          dense
          outlined
          emit-value
          map-options
          :options="countryOptions"
          label="Country"
          class="migration-preview-page__small-select"
        />

        <q-select
          v-model="selectedLanguage"
          dense
          outlined
          emit-value
          map-options
          :options="languageOptions"
          label="Language"
          class="migration-preview-page__small-select"
        />

        <q-select
          v-model="selectedSeries"
          dense
          outlined
          emit-value
          map-options
          :options="seriesOptions"
          label="Series"
          class="migration-preview-page__small-select"
        />

        <div class="migration-preview-page__actions">
          <q-btn dense label="Prev" :disable="!hasPrevious" @click="goPrevious" />
          <q-btn dense label="Next" :disable="!hasNext" @click="goNext" />
          <q-btn dense color="primary" label="Reload" @click="loadPreview" />
        </div>
      </div>

      <div v-if="loading" class="migration-preview-page__message">Loading preview…</div>

      <div v-else-if="errorMessage" class="migration-preview-page__message">
        {{ errorMessage }}
      </div>

      <div v-else class="migration-preview-page__grid">
        <section v-if="content" class="migration-preview-page__panel">
          <h4>Generated JSON</h4>
          <a
            :href="rawLessonUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="migration-preview-page__link"
          >
            See Source
          </a>
          <pre>{{ prettyJson }}</pre>
        </section>

        <section
          v-if="content"
          :dir="content.direction"
          :lang="content.htmlLang"
          :data-number-system="content.numberSystem"
          class="migration-preview-page__panel"
        >
          <h4>Rendered Preview</h4>

          <EditorJsContent
            v-if="editorJsContent"
            :content="editorJsContent"
            :resolve-block-component="resolveSharedBlockComponent"
          />
        </section>

        <section class="migration-preview-page__panel">
          <h4>
            Live Website —
            <a
              :href="liveLessonUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="migration-preview-page__link"
            >
              Open in new tab
            </a>
          </h4>

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
.migration-preview-page__link {
  font-size: 1rem;
  margin-left: 8px;
  color: #3c6e89;
  text-decoration: underline;
  cursor: pointer;
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
  height: 1200px;
  border: 0;
  background: #fff;
}

.migration-preview-page__message {
  padding: 24px;
}

.migration-preview-page__panel[data-number-system='arab'] :deep(ol) {
  list-style-type: arabic-indic;
}

.migration-preview-page__panel[data-number-system='arabext'] :deep(ol) {
  list-style-type: persian;
}

.migration-preview-page__panel[data-number-system='deva'] :deep(ol) {
  list-style-type: devanagari;
}

.migration-preview-page__panel[data-number-system='taml'] :deep(ol) {
  list-style-type: tamil;
}
.migration-preview-page__panel[data-number-system='arab'] :deep(ol) {
  list-style-type: arabic-indic;
  direction: rtl;
  text-align: start;
}

.migration-preview-page__panel[data-number-system='arab'] :deep(li::marker) {
  direction: rtl;
}
.migration-preview-page__small-select {
  min-width: 110px;
}
:deep(.paragraph-block.for-enrichment) {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  background: #f7f3e8;
  border-left: 4px solid #c8b57a;
  border-radius: 6px;
  font-style: italic;
}

:deep(.paragraph-block.for-enrichment p) {
  margin: 0;
}

:deep(img.lesson-image) {
  max-width: 95%;
  height: auto;
  display: block;
  margin: 0 auto;
}
</style>
