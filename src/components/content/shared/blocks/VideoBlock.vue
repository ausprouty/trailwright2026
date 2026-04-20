<script setup lang="ts">
import { computed, ref } from 'vue';

type VideoSource = '' | 'arclight' | 'youtube' | 'vimeo';

type VideoBlockData = {
  title?: string;
  url?: string;
  source?: VideoSource;
  refId?: string;
  startTime?: string;
  endTime?: string;
  isOpen?: boolean;
};

const props = defineProps<{
  data: VideoBlockData;
}>();

const isOpen = ref(typeof props.data.isOpen === 'boolean' ? props.data.isOpen : true);

function parseTimeToSeconds(value?: string): number | null {
  const raw = (value || '').trim().toLowerCase();

  if (!raw) {
    return null;
  }

  if (raw === 'start') {
    return 0;
  }

  if (raw === 'end') {
    return null;
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const parts = raw.split(':').map((part) => part.trim());

  if (!parts.every((part) => /^\d+$/.test(part))) {
    return null;
  }

  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function detectSourceFromUrl(rawUrl?: string): {
  source: VideoSource;
  refId: string;
} {
  const trimmed = (rawUrl || '').trim();

  if (!trimmed) {
    return {
      source: '',
      refId: '',
    };
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes('api.arclight.org') || hostname.includes('arclight.org')) {
      return {
        source: 'arclight',
        refId: url.searchParams.get('refId') || '',
      };
    }

    if (hostname.includes('youtube.com')) {
      return {
        source: 'youtube',
        refId: url.searchParams.get('v') || '',
      };
    }

    if (hostname.includes('youtu.be')) {
      const parts = url.pathname.split('/').filter(Boolean);
      return {
        source: 'youtube',
        refId: parts[0] || '',
      };
    }

    if (hostname.includes('vimeo.com')) {
      const parts = url.pathname.split('/').filter(Boolean);
      return {
        source: 'vimeo',
        refId: parts[parts.length - 1] || '',
      };
    }
  } catch {
    return {
      source: '',
      refId: '',
    };
  }

  return {
    source: '',
    refId: '',
  };
}

const detected = computed(() => {
  const explicitSource = props.data.source || '';
  const explicitRefId = props.data.refId || '';

  if (explicitSource && explicitRefId) {
    return {
      source: explicitSource,
      refId: explicitRefId,
    };
  }

  return detectSourceFromUrl(props.data.url);
});

const headerText = computed(() => {
  const displayTitle = props.data.title || 'Untitled video';
  return `Watch ${displayTitle} online`;
});

const embedUrl = computed(() => {
  const source = detected.value.source;
  const refId = detected.value.refId;

  if (!source || !refId) {
    return '';
  }

  if (source === 'arclight') {
    const url = new URL('https://api.arclight.org/videoPlayerUrl');
    url.searchParams.set('refId', refId);

    const start = parseTimeToSeconds(props.data.startTime);
    const end = parseTimeToSeconds(props.data.endTime);

    if (start !== null) {
      url.searchParams.set('start', String(start));
    }

    if (end !== null) {
      url.searchParams.set('end', String(end));
    }

    return url.toString();
  }

  if (source === 'youtube') {
    const url = new URL(`https://www.youtube.com/embed/${encodeURIComponent(refId)}`);

    const start = parseTimeToSeconds(props.data.startTime);
    const end = parseTimeToSeconds(props.data.endTime);

    if (start !== null) {
      url.searchParams.set('start', String(start));
    }

    if (end !== null) {
      url.searchParams.set('end', String(end));
    }

    return url.toString();
  }

  if (source === 'vimeo') {
    const baseUrl = `https://player.vimeo.com/video/${encodeURIComponent(refId)}`;

    const start = parseTimeToSeconds(props.data.startTime);

    if (start !== null) {
      return `${baseUrl}#t=${start}s`;
    }

    return baseUrl;
  }

  return '';
});

function toggleOpen(): void {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="video-block">
    <button type="button" class="video-block__header" @click="toggleOpen">
      <span class="video-block__header-left">
        <span class="video-block__icon">▶</span>
        <span class="video-block__title">
          {{ headerText }}
        </span>
      </span>

      <span class="video-block__toggle">
        {{ isOpen ? '−' : '+' }}
      </span>
    </button>

    <div v-if="isOpen" class="video-block__body">
      <div
        v-if="embedUrl"
        class="video-block__iframe-wrap"
        :class="{ 'video-block__iframe-wrap--arclight': detected.source === 'arclight' }"
      >
        <iframe
          :src="embedUrl"
          class="video-block__iframe"
          allowfullscreen
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
        />
      </div>

      <div v-else class="video-block__preview-unavailable">
        Preview unavailable until the video URL is recognised.
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-block {
  margin: 20px 0;
  background: #efefef;
  border-radius: 4px;
  overflow: hidden;
}

.video-block__header {
  width: 100%;
  border: 0;
  background: #727272;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: inherit;
  cursor: pointer;
}

.video-block__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-block__icon {
  font-size: 1rem;
  line-height: 1;
}

.video-block__title {
  font-weight: 600;
}

.video-block__toggle {
  font-size: 1.5rem;
  line-height: 1;
}

.video-block__body {
  padding: 20px;
  background: #f3f3f3;
}

.video-block__iframe-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
}

.video-block__iframe-wrap--arclight {
  min-height: 520px;
}

.video-block__iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #ddd;
}

.video-block__preview-unavailable {
  line-height: 1.6;
  color: #555;
}
</style>
