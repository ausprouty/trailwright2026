<script setup lang="ts">
import { ref } from 'vue';

type BibleRef = {
  id: string;
  reference: string;
  html: string;
  instructionKey?: string;
};

const props = defineProps<{
  data: {
    text?: string;
    bibleRefs?: BibleRef[];
  };
}>();

const activeBibleRef = ref<BibleRef | null>(null);
  function renderInstruction(ref: BibleRef): string {
  return `Read ${ref.reference}`;
}

function handleClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;

  if (!target || !target.classList.contains('bible-ref')) {
    return;
  }

  const refId = target.dataset.refId || '';

  activeBibleRef.value =
    props.data.bibleRefs?.find((ref) => ref.id === refId) || null;
}

function closeBibleRef(): void {
  activeBibleRef.value = null;
}
</script>

<template>
  <div class="paragraph-block">
    <p @click="handleClick">
      <span v-html="data.text || ''" />
    </p>

    <div
      v-if="activeBibleRef"
      class="bible-ref-overlay"
      @click.self="closeBibleRef"
    >
      <div class="bible-ref-modal">
        <div class="bible-ref-header">
          <strong>{{ renderInstruction(activeBibleRef) }}</strong>

          <button
            type="button"
            @click="closeBibleRef"
          >
            Close
          </button>
        </div>

        <div
          class="bible-ref-content"
          v-html="activeBibleRef.html"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.paragraph-block {
  margin: 0 0 1rem;
  line-height: 1.6;
}

:deep(.bible-ref) {
  color: var(--q-primary);
  cursor: pointer;
  text-decoration: underline;
}



.bible-ref-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.bible-ref-modal {
  background: white;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 10px;
  padding: 1rem;
}

.bible-ref-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.bible-ref-content {
  line-height: 1.6;
}
</style>