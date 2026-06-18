<script setup lang="ts">
import type { EditorJsContent } from 'src/types/content/EditorBlocks';

defineProps<{
  content: EditorJsContent;
  resolveBlockComponent: (type: string) => unknown;
}>();
</script>

<template>
  <div class="editorjs-content">
    <component
      v-for="(block, index) in content.blocks || []"
      :key="block.id ?? index"
      :is="resolveBlockComponent(block.type)"
      :data="block.data"
      :number-system="content.numberSystem ?? 'latn'"
    />
  </div>
</template>
