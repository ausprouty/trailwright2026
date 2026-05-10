<script setup lang="ts">
import { computed } from 'vue';
import { iconListIcons } from '../iconListIcons';
type IconListIconKey = keyof typeof iconListIcons;

type SectionTheme =
  | 'back'
  | 'up'
  | 'forward'
  | 'review'
  | 'challenge'
  | 'bible-study'
  | 'questions-practice'
  | 'bible-commentary';

const props = defineProps<{
  data: {
    theme: SectionTheme;
    title?: string;
    icon?: string;
  };
}>();

const label = computed(() => props.data.title || '');

const iconSvg = computed(() => {
  const iconKey = props.data.icon as IconListIconKey | undefined;

  if (!iconKey) {
    return '';
  }

  return iconListIcons[iconKey]?.svg || '';
});
</script>

<template>
  <div :class="['section-marker-block', `section-marker-block--${data.theme}`]">
    <span v-if="iconSvg" class="section-marker-block__icon" v-html="iconSvg" />

    <span class="section-marker-block__label">
      {{ label }}
    </span>
  </div>
</template>

<style scoped>
.section-marker-block {
  align-items: center;
  display: flex;
  font-weight: 700;
  gap: 0.5rem;
  margin: 1.5rem 0 1rem;
}

.section-marker-block__image {
  height: 1.5rem;
  width: 1.5rem;
}

.section-marker-block__label {
  color: #111;
}

.section-marker-block--back .section-marker-block__label,
.section-marker-block--up .section-marker-block__label,
.section-marker-block--forward .section-marker-block__label {
  font-weight: 800;
}

.section-marker-block__icon {
  display: inline-flex;
  height: 1.5rem;
  width: 1.5rem;
}

.section-marker-block__icon :deep(svg) {
  display: block;
  height: 100%;
  width: 100%;
}

.section-marker-block__icon :deep(.icon-list-icon__circle) {
  fill: #000;
}

.section-marker-block__icon :deep(.icon-list-icon__fill) {
  fill: #fff;
}
</style>
