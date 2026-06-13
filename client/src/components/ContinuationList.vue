<template>
  <div class="continuation-list">
    <div v-if="continuations.length === 0" class="empty">暂无续写</div>
    <div v-for="c in continuations" :key="c.id" class="continuation-item">
      <p>{{ c.content }}</p>
      <div class="meta">
        <span>@{{ c.username }}</span>
        <span>{{ c.created_at?.slice(0, 10) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/client';

const props = defineProps({ dreamId: { type: [String, Number], required: true } });
const continuations = ref([]);

onMounted(async () => {
  try {
    const res = await apiClient.get(`/dreams/${props.dreamId}/continuations`);
    continuations.value = res.data;
  } catch { /* ignore */ }
});
</script>
