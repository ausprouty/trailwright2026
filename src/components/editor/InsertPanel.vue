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
  width: 340px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  overflow-x: hidden;
  background: #fff7ed;
  border: 1px solid #f0cfae;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 10px 24px rgba(120, 70, 20, 0.08);
}

.insert-panel__header {
  margin-bottom: 18px;
}

.insert-panel__header h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
  color: #8a4b14;
}

.insert-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.insert-panel__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  min-height: 60px;
  border: 1px solid #e7b98c;
  border-radius: 16px;
  background: #ffffff;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.insert-panel__item:hover {
  background: #fff1de;
  border-color: #d88a42;
  box-shadow: 0 4px 12px rgba(160, 90, 44, 0.14);
  transform: translateY(-1px);
}

.insert-panel__item:active {
  transform: translateY(0);
}

.insert-panel__icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32px;
  color: #a05a2c;
}

.insert-panel__icon :deep(svg) {
  width: 22px;
  height: 22px;
  display: block;
}

.insert-panel__label {
  width: 100%;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  color: #2f241c;
  text-align: center;
  word-break: normal;
  overflow-wrap: break-word;
}
</style>
