<script setup lang="ts">
import { computed } from 'vue';
import { contentBlockIcons } from '../contentBlockIcons';
import type { ListBlockData, ListItem } from 'src/types/content/ListBlock';

type IconListIconKey = keyof typeof contentBlockIcons;

const props = defineProps<{
  data: ListBlockData;
}>();

const tagName = computed(() => {
  return props.data.style === 'ordered' ? 'ol' : 'ul';
});

const items = computed<ListItem[]>(() => {
  return Array.isArray(props.data.items) ? props.data.items : [];
});

const hasIcons = computed(() => {
  return items.value.some((item) => {
    return item && typeof item === 'object' && typeof item.icon === 'string';
  });
});

const isLessonList = computed(() => {
  return props.data.variant === 'lesson-list' || hasIcons.value;
});

function itemContent(item: ListItem): string {
  if (typeof item === 'string') {
    return item;
  }

  return item.text || '';
}

function itemIconSvg(item: ListItem): string {
  if (!item || typeof item !== 'object' || typeof item.icon !== 'string') {
    return '';
  }

  const iconKey = item.icon as IconListIconKey;

  return contentBlockIcons[iconKey]?.svg || '';
}

function itemChildren(item: ListItem): ListBlockData | null {
  if (
    item &&
    typeof item === 'object' &&
    item.children &&
    Array.isArray(item.children.items) &&
    item.children.items.length > 0
  ) {
    return item.children;
  }

  return null;
}
</script>

<template>
  <component
    :is="tagName"
    v-if="items.length"
    class="list-block"
    :class="{
      'list-block--ordered': data.style === 'ordered',
      'list-block--unordered': data.style !== 'ordered',
      'list-block--lesson': isLessonList,
    }"
  >
    <li
      v-for="(item, index) in items"
      :key="index"
      class="list-block__item"
    >
      <span
        v-if="itemIconSvg(item)"
        class="list-block__icon"
        v-html="itemIconSvg(item)"
      />

      <span
        class="list-block__content"
        v-html="itemContent(item)"
      />

      <ListBlock
        v-if="itemChildren(item)"
        :data="itemChildren(item)!"
        class="list-block--nested"
      />
    </li>
  </component>
</template>

<style scoped>
.list-block {
  margin: 1rem 0;
  padding-left: 1.5rem;
  font-family: Arial, sans-serif;
}

.list-block--unordered {
  list-style-type: disc;
}

.list-block--ordered {
  list-style-type: decimal;
}

.list-block__item {
  margin-bottom: 0.6rem;
  line-height: 1.4;
}

.list-block__content {
  line-height: 1.4;
}

.list-block--nested {
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.list-block--lesson {
  padding-left: 0;
  list-style: none;
}

.list-block--lesson > .list-block__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.list-block__icon {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
}

.list-block__icon :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
