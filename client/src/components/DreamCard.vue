<template>
  <div class="dream-card" @click="$router.push(`/dreams/${dream.id}`)">
    <h3>{{ dream.title || '无标题' }}</h3>
    <p class="preview">{{ preview }}</p>
    <div class="meta">
      <span>@{{ dream.username }}</span>
      <span>{{ dream.created_at?.slice(0, 10) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  dream: Object
});

const preview = computed(() => {
  const t = props.dream.content || '';
  return t.length > 100 ? t.slice(0, 100) + '...' : t;
});
</script>

<style scoped>
.dream-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.dream-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.preview {
  color: #666;
  font-size: 0.9em;
  margin: 8px 0;
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: #999;
}
</style>
