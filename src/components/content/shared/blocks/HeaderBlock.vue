<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: {
    text?: string;
    level?: number;
    image?: string;
  };
}>();

const tagName = computed(() => {
  if (props.data.level === 1) {
    return 'h1';
  }

  if (props.data.level === 2) {
    return 'h2';
  }

  if (props.data.level === 3) {
    return 'h3';
  }

  if (props.data.level === 4) {
    return 'h4';
  }

  return 'h2';
});
</script>

<template>
  <component :is="tagName" class="header-block">
    <img v-if="data.image" :src="data.image" class="header-icon" alt="" />
    <span v-html="data.text || ''" />
  </component>
</template>

<style scoped>
.header-block {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.25rem 0 0.75rem;
  line-height: 1.3;
}

.header-icon {
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
  flex: 0 0 auto;
}

/* ✅ Add these */
h1.header-block {
  font-size: 2rem;
  font-weight: 700;
}

h2.header-block {
  font-size: 1.5rem;
  font-weight: 700;
}

h3.header-block {
  font-size: 1.2rem;
  font-weight: 700;
}

h4.header-block {
  font-size: 1.05rem;
  font-weight: 600;
}
</style>
