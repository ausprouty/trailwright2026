<script setup lang="ts">
import EditorJsContent from '../../EditorJsContent.vue';
import type { EditorJsContent as EditorJsContentType } from 'src/types/EditorBlocks';
import { resolveSharedBlockComponent } from '../../shared/resolveSharedBlockComponent';

defineProps<{
  content: EditorJsContentType;
}>();

function resolveCojourners67BlockComponent(type: string) {
  return resolveSharedBlockComponent(type);
}
</script>

<template>
  <EditorJsContent
    :content="content"
    :resolve-block-component="resolveCojourners67BlockComponent"
  />
</template>
