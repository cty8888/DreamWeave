<template>
  <div class="page">
    <div class="section-head">
      <p class="eyebrow">你的梦境档案</p>
      <h1>我的梦境</h1>
    </div>

    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <div v-if="filtered.length" class="grid stagger">
      <DreamCard v-for="d in filtered" :key="d.id" :dream="d" />
    </div>
    <p v-else class="empty-state">这里还空空如也，去记录第一个梦吧。</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '../api/client';
import DreamCard from '../components/DreamCard.vue';

const dreams = ref([]);
const tab = ref('all');
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'private', label: '私有' },
  { key: 'public', label: '公开' },
];

onMounted(async () => {
  const r = await apiClient.get('/dreams', { params: { page: 1, limit: 50 } });
  dreams.value = r.data.data;
});

const filtered = computed(() =>
  tab.value === 'all' ? dreams.value : dreams.value.filter((d) => d.visibility === tab.value)
);
</script>

<style scoped>
.tabs {
  display: inline-flex;
  gap: 4px;
  padding: 5px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  margin-bottom: 28px;
}
.tab {
  background: transparent;
  color: var(--mist);
  box-shadow: none;
  padding: 8px 22px;
  font-size: 0.9rem;
}
.tab:hover:not(.active) {
  color: var(--moon);
  transform: none;
  box-shadow: none;
}
.tab.active {
  color: var(--ink-on-light);
  background: var(--grad-aurora);
  box-shadow: var(--glow-indigo);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 20px;
}
</style>
