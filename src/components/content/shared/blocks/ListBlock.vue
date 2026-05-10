<script setup lang="ts">
import { computed } from 'vue';
import { iconListIcons } from '../iconListIcons';

type IconListIconKey = keyof typeof iconListIcons;

type EditorJsListItem =
  | string
  | {
      content?: string;
      text?: string;
      icon?: string;
      items?: EditorJsListItem[];
    };

type ListBlockData = {
  style?: 'ordered' | 'unordered';
  variant?: string;
  items?: EditorJsListItem[];
};

const props = defineProps<{
  data: ListBlockData;
}>();

const tagName = computed(() => {
  return props.data.style === 'ordered' ? 'ol' : 'ul';
});

const items = computed(() => {
  return Array.isArray(props.data.items) ? props.data.items : [];
});

function itemContent(item: EditorJsListItem): string {
  if (typeof item === 'string') {
    return item;
  }

  if (item && typeof item.text === 'string') {
    return item.text;
  }

  if (item && typeof item.content === 'string') {
    return item.content;
  }

  return '';
}

function itemIconSvg(item: EditorJsListItem): string {
  if (!item || typeof item !== 'object' || typeof item.icon !== 'string') {
    return '';
  }

  const iconKey = item.icon as IconListIconKey;

  return iconListIcons[iconKey]?.svg || '';
}

function itemChildren(item: EditorJsListItem): EditorJsListItem[] {
  if (item && typeof item === 'object' && Array.isArray(item.items)) {
    return item.items;
  }

  return [];
}

function hasChildren(item: EditorJsListItem): boolean {
  return itemChildren(item).length > 0;
}
</script>

<template>
  <component
    :is="tagName"
    v-if="items.length"
    class="list-block"
    :class="{ 'list-block--lesson': data.variant === 'lesson-list' }"
  >
    <li v-for="(item, index) in items" :key="index" class="list-block__item">
      <span v-if="itemIconSvg(item)" class="list-block__icon" v-html="itemIconSvg(item)" />

      <span v-html="itemContent(item)" />

      <component :is="tagName" v-if="hasChildren(item)" class="list-block list-block--nested">
        <li
          v-for="(child, childIndex) in itemChildren(item)"
          :key="childIndex"
          class="list-block__item"
        >
          <span v-if="itemIconSvg(child)" class="list-block__icon" v-html="itemIconSvg(child)" />

          <span v-html="itemContent(child)" />

          <component :is="tagName" v-if="hasChildren(child)" class="list-block list-block--nested">
            <li
              v-for="(grandChild, grandChildIndex) in itemChildren(child)"
              :key="grandChildIndex"
              class="list-block__item"
            >
              <span
                v-if="itemIconSvg(grandChild)"
                class="list-block__icon"
                v-html="itemIconSvg(grandChild)"
              />

              <span v-html="itemContent(grandChild)" />
            </li>
          </component>
        </li>
      </component>
    </li>
  </component>
</template>

<style scoped>
.section-marker-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  font-family: Arial, sans-serif;
  font-weight: bold;
  text-transform: uppercase;
}

.section-marker-block__icon,
.list-block__icon {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
}

.section-marker-block__icon :deep(svg),
.list-block__icon :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.list-block {
  margin: 1rem 0;
  padding-left: 0;
  list-style: none;
  font-family: Arial, sans-serif;
}

.list-block__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.list-block__content {
  line-height: 1.4;
}
</style>
