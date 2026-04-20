<script setup lang="ts">
import { computed } from 'vue';

type SectionTheme = 'back' | 'up' | 'forward';

const props = defineProps<{
  data: {
    theme: SectionTheme;
  };
}>();

const label = computed(() => {
  if (props.data.theme === 'back') {
    return 'LOOK BACK';
  }

  if (props.data.theme === 'up') {
    return 'LOOK UP';
  }

  return 'LOOK FORWARD';
});

const symbol = computed(() => {
  if (props.data.theme === 'back') {
    return '⬅';
  }

  if (props.data.theme === 'up') {
    return '⬆';
  }

  return '➡';
});
</script>

<template>
  <div class="section-marker-block">
    <span class="section-marker-block__icon">
      {{ symbol }}
    </span>
    <span class="section-marker-block__label">
      {{ label }}
    </span>
  </div>
</template>

<style scoped>
.section-marker-block {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 28px 0 16px;
}

.section-marker-block__icon {
  font-size: 2rem;
  line-height: 1;
}

.section-marker-block__label {
  font-size: 2rem;
  font-weight: 500;
  line-height: 1.1;
}
</style>
