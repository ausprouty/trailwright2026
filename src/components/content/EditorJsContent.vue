<script setup lang="ts">
import type { EditorJsContent } from 'src/types/content/xEditorBlocks';

defineProps<{
  content: EditorJsContent;
  resolveBlockComponent: (type: string) => unknown;
}>();
</script>

<template>
  <div class="editorjs-content">
    <component
      v-for="(block, index) in content.blocks || []"
      :key="index"
      :is="resolveBlockComponent(block.type)"
      :data="block.data"
    />
  </div>
</template>
