<script setup lang="ts">
import { computed, ref } from 'vue';

type BibleReference = {
  id: string;
  marker: string;
  label: string;
  passage: string;
};

type BibleReferenceBlockData = {
  text?: string;
  references?: BibleReference[];
  isOpen?: boolean;
};

const props = defineProps<{
  data: BibleReferenceBlockData;
}>();

const firstReferenceId =
  props.data.isOpen === true ? (props.data.references?.at(0)?.id ?? null) : null;

const openReferenceId = ref<string | null>(firstReferenceId);

const references = computed(() => props.data.references || []);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const renderedText = computed(() => {
  let html = props.data.text || '';

  references.value.forEach((reference) => {
    const markerPattern = new RegExp(`\\{${escapeRegExp(reference.marker)}\\}`, 'g');

    html = html.replace(
      markerPattern,
      `<button type="button" class="bible-reference-link" data-reference-id="${escapeHtml(
        reference.id,
      )}">${escapeHtml(reference.label)}</button>`,
    );
  });

  return html;
});

const openReference = computed(() => {
  return references.value.find((reference) => reference.id === openReferenceId.value);
});

function handleTextClick(event: MouseEvent): void {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>('.bible-reference-link');

  if (!button) {
    return;
  }

  const referenceId = button.dataset.referenceId;

  if (!referenceId) {
    return;
  }

  openReferenceId.value = openReferenceId.value === referenceId ? null : referenceId;
}
</script>

<template>
  <section class="bible-reference-block">
    <div class="bible-reference-block__text" @click="handleTextClick" v-html="renderedText" />

    <div v-if="openReference" class="bible-reference-block__passage">
      <div class="bible-reference-block__passage-title">
        {{ openReference.label }}
      </div>

      <div class="bible-reference-block__passage-text" v-html="openReference.passage" />
    </div>
  </section>
</template>

<style scoped>
.bible-reference-block {
  margin: 1rem 0;
}

.bible-reference-block__text :deep(p) {
  margin: 0 0 0.9rem;
}

.bible-reference-block__text :deep(.bible-reference-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0 0.1rem;
  padding: 0.08rem 0.4rem;
  border: 1px solid rgba(25, 118, 210, 0.35);
  border-radius: 999px;
  background: rgba(25, 118, 210, 0.08);
  color: #1565c0;
  font: inherit;
  font-size: 0.92em;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
}

.bible-reference-block__text :deep(.bible-reference-link)::before {
  content: '📖';
  font-size: 0.9em;
}

.bible-reference-block__text :deep(.bible-reference-link:hover) {
  background: rgba(25, 118, 210, 0.14);
  border-color: rgba(25, 118, 210, 0.6);
  text-decoration: none;
}

.bible-reference-block__passage {
  margin: 1rem 0 1.25rem;
  overflow: hidden;
  border: 1px solid rgba(25, 118, 210, 0.35);
  border-left: 6px solid #1976d2;
  border-radius: 8px;
  background: #f7fbff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.bible-reference-block__passage-title {
  padding: 0.65rem 0.9rem;
  background: rgba(25, 118, 210, 0.12);
  color: #0d47a1;
  font-weight: 700;
}

.bible-reference-block__passage-text {
  padding: 0.8rem 0.95rem 0.95rem;
  line-height: 1.6;
}

.bible-reference-block__passage-text :deep(sup) {
  position: relative;
  top: -0.25em;
  margin-right: 0.12rem;
  color: #0d47a1;
  font-size: 0.75em;
  font-weight: 700;
}
</style>
