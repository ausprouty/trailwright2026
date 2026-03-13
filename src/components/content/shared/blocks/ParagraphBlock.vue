<script setup lang="ts">
defineProps<{
  data: {
    text?: string;
  };
}>();
</script>

<template>
  <p class="paragraph-block">
    <span v-html="data.text || ''" />
  </p>
</template>

<style scoped>
.paragraph-block {
  margin: 0 0 1rem;
  line-height: 1.6;
}
</style>
