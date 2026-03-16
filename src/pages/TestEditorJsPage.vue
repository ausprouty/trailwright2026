<script setup lang="ts">
import MyFriendsEditorJsContent from 'src/components/content/sites/myfriends/MyFriendsEditorJsContent.vue';
import type { EditorJsContent } from 'src/types/EditorBlocks';

const sampleContent: EditorJsContent = {
  blocks: [
    {
      type: 'header',
      data: {
        text: 'Welcome',
        level: 2,
      },
    },
    {
      type: 'paragraph',
      data: {
        text: 'This is a test paragraph.',
      },
    },
  ],
};
</script>

<template>
  <q-page class="q-pa-lg">
    <MyFriendsEditorJsContent :content="sampleContent" />
  </q-page>
</template>
