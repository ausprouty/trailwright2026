<script setup lang="ts">
import EditorJsContent from '../../EditorJsContent.vue';
import type { EditorJsContent as EditorJsContentType } from 'src/types/content/xEditorBlocks';
import { resolveSharedBlockComponent } from '../../shared/resolveSharedBlockComponent';

defineProps<{
  content: EditorJsContentType;
}>();

function resolveMc2BlockComponent(type: string) {
  return resolveSharedBlockComponent(type);
}
</script>

<template>
  <EditorJsContent :content="content" :resolve-block-component="resolveMc2BlockComponent" />
</template>
