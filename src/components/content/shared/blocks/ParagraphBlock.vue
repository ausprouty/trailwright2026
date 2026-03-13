<script setup lang="ts">
defineProps<{
  data: {
    text?: string;
  };
}>();
</script>

<template>
  <p class="paragraph-block" v-html="data.text || ''" />
</template>

<style scoped>
.paragraph-block {
  margin: 0 0 1rem;
  line-height: 1.6;
}
</style>
