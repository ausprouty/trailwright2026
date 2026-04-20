<script setup lang="ts">
import { computed, ref } from 'vue';

type BiblePassageBlockData = {
  reference?: string;
  html?: string;
  url?: string;
  isOpen?: boolean;
};

const props = defineProps<{
  data: BiblePassageBlockData;
}>();

const isOpen = ref(typeof props.data.isOpen === 'boolean' ? props.data.isOpen : true);

const title = computed(() => {
  return props.data.reference ? `Read ${props.data.reference}` : 'Read passage';
});

function toggleOpen(): void {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="bible-passage-block">
    <button type="button" class="bible-passage-block__header" @click="toggleOpen">
      <span class="bible-passage-block__header-left">
        <span class="bible-passage-block__icon">✟</span>
        <span class="bible-passage-block__title">
          {{ title }}
        </span>
      </span>

      <span class="bible-passage-block__toggle">
        {{ isOpen ? '−' : '+' }}
      </span>
    </button>

    <div v-if="isOpen" class="bible-passage-block__body">
      <div v-if="data.html" class="bible-passage-block__passage" v-html="data.html" />

      <div v-if="data.url" class="bible-passage-block__read-more-wrap">
        <a
          :href="data.url"
          target="_blank"
          rel="noopener noreferrer"
          class="bible-passage-block__read-more"
        >
          Read More
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bible-passage-block {
  margin: 20px 0;
  background: #efefef;
  border-radius: 4px;
  overflow: hidden;
}

.bible-passage-block__header {
  width: 100%;
  border: 0;
  background: #727272;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: inherit;
  cursor: pointer;
}

.bible-passage-block__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bible-passage-block__icon {
  font-size: 1rem;
  line-height: 1;
}

.bible-passage-block__title {
  font-weight: 600;
}

.bible-passage-block__toggle {
  font-size: 1.5rem;
  line-height: 1;
}

.bible-passage-block__body {
  padding: 20px;
  background: #f3f3f3;
}

.bible-passage-block__passage {
  line-height: 1.7;
}

.bible-passage-block__read-more-wrap {
  margin-top: 16px;
}

.bible-passage-block__read-more {
  color: #c62828;
  text-decoration: underline;
}
</style>
