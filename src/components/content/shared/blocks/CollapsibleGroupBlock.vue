<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { resolveSharedBlockComponent } from '../resolveSharedBlockComponent';

type NestedBlock = {
  id?: string;
  type: string;
  data: Record<string, unknown>;
};

type NestedContent = {
  blocks?: NestedBlock[];
  version?: string;
  time?: number;
};

type CollapsibleGroupBlockData = {
  title?: string;
  isOpen?: boolean;
  content?: NestedContent;
};

const props = defineProps<{
  data: CollapsibleGroupBlockData;
}>();

const isOpen = ref(Boolean(props.data.isOpen));

watch(
  () => props.data.isOpen,
  (value) => {
    isOpen.value = Boolean(value);
  },
);

const nestedBlocks = computed<NestedBlock[]>(() => {
  return props.data.content?.blocks || [];
});

function toggleOpen(): void {
  isOpen.value = !isOpen.value;
}

function resolveBlock(type: string) {
  return resolveSharedBlockComponent(type);
}
</script>

<template>
  <section class="collapsible-group-block">
    <button class="collapsible-group-toggle" type="button" @click="toggleOpen">
      <span class="collapsible-group-indicator">
        {{ isOpen ? '▾' : '▸' }}
      </span>
      <span class="collapsible-group-title">
        {{ data.title || 'Details' }}
      </span>
    </button>

    <div v-if="isOpen" class="collapsible-group-content">
      <template v-for="(block, index) in nestedBlocks" :key="block.id || `${block.type}-${index}`">
        <component
          :is="resolveBlock(block.type)"
          v-if="resolveBlock(block.type)"
          :data="block.data"
        />
      </template>
    </div>
  </section>
</template>

<style scoped>
.collapsible-group-block {
  margin: 1rem 0;
  border: 1px solid #cfc7bc;
  border-radius: 14px;
  background: #f5f1eb;
  overflow: hidden;
}

.collapsible-group-toggle {
  width: 100%;
  padding: 1rem 1.1rem;
  border: 0;
  background: #ddd8d1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.collapsible-group-indicator {
  flex: 0 0 auto;
}

.collapsible-group-title {
  flex: 1 1 auto;
}

.collapsible-group-content {
  padding: 1rem 1.1rem;
}
</style>
