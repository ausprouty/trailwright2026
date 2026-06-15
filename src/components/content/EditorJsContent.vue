<script setup lang="ts">
import type { EditorJsContent } from 'src/types/content/EditorBlocks';

defineProps<{
  content: EditorJsContent;
  resolveBlockComponent: (type: string) => unknown;
}>();
</script>

<template>
  <div class="editorjs-content">
    <div
      v-for="(block, index) in content.blocks || []"
      :key="block.id ?? index"
      class="debug-block-wrapper"
    >
      <pre class="debug-block-info"
        >{{ index }} — {{ block.type }} — {{ JSON.stringify(block.data, null, 2) }}
      </pre>

      <component
        :is="resolveBlockComponent(block.type)"
        :data="block.data"
        :number-system="content.numberSystem ?? 'latn'"
      />
    </div>
  </div>
</template>

<style scoped>
.debug-block-wrapper {
  border: 1px dashed #ccc;
  margin: 0.5rem 0;
  padding: 0.5rem;
}

.debug-block-info {
  background: #f5f5f5;
  color: #333;
  font-size: 11px;
  margin: 0 0 0.5rem;
  overflow-x: auto;
  padding: 0.4rem;
  white-space: pre-wrap;
}
</style>
