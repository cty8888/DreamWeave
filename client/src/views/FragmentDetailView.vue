<template>
  <div class="page page--narrow">
    <div class="section-head">
      <p class="eyebrow">一次编织的原料</p>
      <h1>历史碎片</h1>
    </div>

    <div v-if="fragments.length" class="frag-list">
      <article v-for="(f, i) in fragments" :key="f.id" class="frag glass">
        <span class="frag-num">{{ i + 1 }}</span>
        <p class="frag-text">{{ f.content }}</p>
      </article>
    </div>
    <p v-else class="empty-state">没有找到这组碎片。</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/client';
const route = useRoute();
const fragments = ref([]);
onMounted(async () => {
  const r = await apiClient.get(`/fragments/sessions/${route.params.id}`);
  fragments.value = r.data;
});
</script>

<style scoped>
.frag-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.frag {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 22px;
}
.frag-num {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--aurora-teal);
  background: rgba(94, 234, 212, 0.1);
  border: 1px solid rgba(94, 234, 212, 0.3);
}
.frag-text {
  font-family: var(--font-serif);
  font-size: 1.02rem;
  line-height: 1.85;
  color: var(--moon);
  white-space: pre-wrap;
}
</style>
