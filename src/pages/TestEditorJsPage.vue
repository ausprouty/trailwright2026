<script setup lang="ts">
import MyFriendsEditorJsContent from 'src/components/content/sites/myfriends/MyFriendsEditorJsContent.vue';

const sampleContent = {
  blocks: [
    {
      type: 'header',
      data: {
        text: 'Welcome to Trailwright',
        level: 2,
      },
    },
    {
      type: 'paragraph',
      data: {
        text: 'This is the first rendered paragraph from EditorJS content.',
      },
    },
    {
      type: 'paragraph',
      data: {
        text: 'Now we know the site renderer is working.',
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
