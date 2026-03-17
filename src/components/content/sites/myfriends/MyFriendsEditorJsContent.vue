<script setup lang="ts">
import EditorJsContent from '../../EditorJsContent.vue';
import type { EditorJsContent as EditorJsContentType } from 'src/types/content/EditorBlocks';
import { resolveSharedBlockComponent } from '../../shared/resolveSharedBlockComponent';

defineProps<{
  content: EditorJsContentType;
}>();

function resolveMyFriendsBlockComponent(type: string) {
  return resolveSharedBlockComponent(type);
}
</script>

<template>
  <EditorJsContent :content="content" :resolve-block-component="resolveMyFriendsBlockComponent" />
</template>
