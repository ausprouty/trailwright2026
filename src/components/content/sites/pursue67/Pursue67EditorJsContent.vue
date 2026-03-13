<script setup lang="ts">
import EditorJsContent from '../../EditorJsContent.vue';
import { resolveSharedBlockComponent } from '../../shared/resolveSharedBlockComponent';

type EditorJsContentData = {
  blocks?: Array<{
    type: string;
    data: unknown;
  }>;
};

defineProps<{
  content: EditorJsContentData;
}>();

function resolvePursue67BlockComponent(type: string) {
  return resolveSharedBlockComponent(type);
}
</script>

<template>
  <EditorJsContent :content="content" :resolve-block-component="resolvePursue67BlockComponent" />
</template>
