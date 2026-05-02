<script setup lang="ts">
import { computed } from 'vue';

type EditorJsListItem =
  | string
  | {
      content?: string;
      items?: EditorJsListItem[];
    };

type ListBlockData = {
  style?: 'ordered' | 'unordered';
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

  if (item && typeof item.content === 'string') {
    return item.content;
  }

  return '';
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
  <component :is="tagName" v-if="items.length" class="list-block">
    <li v-for="(item, index) in items" :key="index" class="list-block__item">
      <span v-html="itemContent(item)" />

      <component :is="tagName" v-if="hasChildren(item)" class="list-block list-block--nested">
        <li
          v-for="(child, childIndex) in itemChildren(item)"
          :key="childIndex"
          class="list-block__item"
        >
          <span v-html="itemContent(child)" />

          <component :is="tagName" v-if="hasChildren(child)" class="list-block list-block--nested">
            <li
              v-for="(grandChild, grandChildIndex) in itemChildren(child)"
              :key="grandChildIndex"
              class="list-block__item"
            >
              <span v-html="itemContent(grandChild)" />
            </li>
          </component>
        </li>
      </component>
    </li>
  </component>
</template>

<style scoped>
.list-block {
  margin: 0 0 1rem;
  padding-inline-start: 1.5rem;
  line-height: 1.6;
}

.list-block__item {
  margin: 0.35rem 0;
}

.list-block--nested {
  margin-top: 0.35rem;
}

.list-block :deep(a) {
  color: #d32f2f;
  text-decoration: underline;
}

.list-block :deep(a:hover) {
  text-decoration-thickness: 2px;
}
</style>
