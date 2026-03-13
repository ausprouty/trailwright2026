<script setup lang="ts">
type EditorJsBlock = {
  type: string;
  data: unknown;
};

type EditorJsContentData = {
  blocks?: EditorJsBlock[];
};

defineProps<{
  content: EditorJsContentData;
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
