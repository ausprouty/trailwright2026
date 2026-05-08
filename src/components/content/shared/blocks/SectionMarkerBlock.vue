<script setup lang="ts">
import { computed } from 'vue';

type SectionTheme =
  | 'back'
  | 'up'
  | 'forward'
  | 'review'
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

const label = computed(() => {
  if (props.data.title) {
    return props.data.title;
  }

  switch (props.data.theme) {
    case 'back':
      return 'LOOK BACK';

    case 'up':
      return 'LOOK UP';

    case 'forward':
      return 'LOOK FORWARD';

    case 'review':
      return 'REVIEWING';

    case 'bible-study':
      return 'BIBLE STUDY';

    case 'questions-practice':
      return 'SPECIFIC QUESTIONS AND PRACTICE';

    case 'bible-commentary':
      return 'COMMENTARY ON THE BIBLE TEXT';

    default:
      return '';
  }
});

const symbol = computed(() => {
  if (props.data.icon) {
    return props.data.icon;
  }
  switch (props.data.theme) {
    case 'back':
      return '⬅';

    case 'up':
      return '⬆';

    case 'forward':
      return '➡';

    case 'review':
      return '↺';

    case 'bible-study':
      return '📖';

    case 'questions-practice':
      return '❖';

    case 'bible-commentary':
      return '📝';
    default:
      return '';
  }
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
