<script setup lang="ts">
import { computed } from 'vue';
import { contentBlockIcons } from '../contentBlockIcons';

type IconListItem = {
  icon: string;
  title?: string;
  text?: string;
};

type IconKey = keyof typeof contentBlockIcons;

const props = defineProps<{
  data: {
    items?: IconListItem[];
  };
}>();

const items = computed(() => {
  return Array.isArray(props.data.items) ? props.data.items : [];
});

function getIconSvg(iconKey: string): string {
  if (iconKey in contentBlockIcons) {
    const key = iconKey as keyof typeof contentBlockIcons;
    return contentBlockIcons[key].svg;
  }
  return '';
}

function getIconLabel(iconKey: string): string {
  const key = iconKey as IconKey;
  return contentBlockIcons[key]?.label || iconKey;
}
</script>

<template>
  <div class="icon-list-block">
    <div
      v-for="(item, index) in items"
      :key="`${item.icon}-${index}`"
      class="icon-list-block__item"
    >
      <span
        class="icon-list-block__icon"
        v-html="getIconSvg(item.icon)"
        :aria-label="getIconLabel(item.icon)"
      />

      <div class="icon-list-block__content">
        <strong v-if="item.title" class="icon-list-block__title">
          {{ item.title }}
        </strong>

        <span class="icon-list-block__text">
          {{ item.text }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-list-block {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin: 18px 0 28px;
}

.icon-list-block__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 1.02rem;
  line-height: 1.5;
  color: #111111;
}

.icon-list-block__icon {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.icon-list-block__icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.icon-list-block__content {
  min-width: 0;
  padding-top: 1px;
}

.icon-list-block__title {
  display: block;
  margin-bottom: 3px;
  font-weight: 700;
}

.icon-list-block__text {
  display: inline;
}
</style>
