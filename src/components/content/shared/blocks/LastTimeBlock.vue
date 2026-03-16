<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useSettingsStore } from 'src/stores/SettingsStore';
import { getNote } from 'src/services/noteService';
import { getStudyProgress } from 'src/services/indexedDBService';
import { useSiteContent } from 'src/composables/useSiteContent';

defineProps<{
  data: Record<string, never> | Record<string, unknown>;
}>();

const settingsStore = useSettingsStore();

const cleanedNote = ref('');
const noteLines = ref<string[]>([]);
const hasNote = ref(false);

const languageCodeIso = computed(() => {
  const obj = settingsStore.textLanguageObjectSelected || null;
  let code = obj && obj.languageCodeIso ? String(obj.languageCodeIso) : '';

  code = code.trim().toLowerCase();

  return code || 'en';
});

const { getSection } = useSiteContent(languageCodeIso);

const review = computed(() => {
  return getSection('review');
});

const reviewIntro = computed(() => {
  return Array.isArray(review.value?.paras) ? review.value.paras : [];
});

const reviewEmpty = computed(() => {
  const value = review.value?.empty || '';
  return String(value).trim();
});

function resetNote(): void {
  hasNote.value = false;
  cleanedNote.value = '';
  noteLines.value = [];
}

async function loadPreviousNote(): Promise<void> {
  const study = settingsStore.currentStudySelected;

  if (!study) {
    resetNote();
    return;
  }

  try {
    const progress = await getStudyProgress(study);
    const lastLesson = progress?.lastCompletedLesson;

    if (!lastLesson || typeof lastLesson !== 'number') {
      resetNote();
      return;
    }

    const note = await getNote(study, lastLesson, 'look_forward');
    const trimmed = note ? note.trim() : '';

    if (!trimmed) {
      resetNote();
      return;
    }

    cleanedNote.value = trimmed;
    noteLines.value = trimmed.split(/\r?\n/).filter((line) => line.trim() !== '');
    hasNote.value = true;
  } catch (error) {
    console.error('[LastTimeBlock] Failed to load previous note:', error);
    resetNote();
  }
}

onMounted(loadPreviousNote);

watch(
  () => settingsStore.currentStudySelected,
  () => {
    void loadPreviousNote();
  },
);

watch(
  () => languageCodeIso.value,
  () => {
    void loadPreviousNote();
  },
);
</script>

<template>
  <div class="last-time-block">
    <template v-if="hasNote">
      <p v-for="(para, index) in reviewIntro" :key="'review-' + index">
        {{ para }}
      </p>

      <p v-for="(line, index) in noteLines" :key="'note-' + index">
        <strong>{{ line }}</strong>
      </p>
    </template>

    <template v-else>
      <p>{{ reviewEmpty }}</p>
    </template>
  </div>
</template>

<style scoped>
.last-time-block {
  background-color: var(--color-minor1, #f2e3cf);
  border-left: 6px solid var(--color-highlight-scripture, #d59744);
  padding: 16px 20px;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 2px 2px 8px var(--color-shadow, rgba(0, 0, 0, 0.12));
  font-size: 15px;
  color: var(--color-minor2, #6a4e42);
}

.last-time-block p {
  margin: 8px 0;
  line-height: 1.5;
}

.last-time-block strong {
  color: var(--color-primary, #a05a2c);
  font-size: 16px;
}
</style>
