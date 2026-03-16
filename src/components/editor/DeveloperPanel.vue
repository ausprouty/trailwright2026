<script setup lang="ts">
import type { OutputData } from "@editorjs/editorjs";

defineProps<{
  output?: OutputData;
}>();
</script>

<template>
  <section class="panel">
    <h2>Saved JSON</h2>
    <pre class="output">{{
      JSON.stringify(output || { blocks: [] }, null, 2)
    }}</pre>
  </section>
</template>