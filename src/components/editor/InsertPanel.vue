<script setup lang="ts">
import { insertToolPalette } from '../editor/toolPalette';

const emit = defineEmits<{
  insert: [type: string, initialData?: Record<string, unknown>];
}>();
</script>

<template>
  <aside class="insert-panel">
    <div class="insert-panel__header">
      <h3>Add block</h3>
    </div>

    <div class="insert-panel__grid">
      <button
        v-for="item in insertToolPalette"
        :key="item.type"
        type="button"
        class="insert-panel__item"
        @click="emit('insert', item.type, item.initialData)"
      >
        <span class="insert-panel__icon" v-html="item.icon" />
        <span class="insert-panel__label">
          {{ item.label }}
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.insert-panel {
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 12px;
  padding: 16px;
}

.insert-panel__header h3 {
  margin: 0 0 12px;
  font-size: 1rem;
}

.insert-panel__grid {
  display: grid;
  gap: 10px;
}

.insert-panel__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  background: #ffffff;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.insert-panel__item:hover {
  background: #f8f8f8;
}

.insert-panel__icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
}

.insert-panel__icon :deep(svg) {
  width: 20px;
  height: 20px;
  display: block;
}

.insert-panel__label {
  font-size: 0.95rem;
  font-weight: 600;
}
</style>
