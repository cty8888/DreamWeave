<template>
  <div class="continuation-list">
    <p v-if="continuations.length === 0" class="empty-state">
      这个梦还在等待第一个续写的人……
    </p>
    <div v-else class="timeline stagger">
      <article v-for="c in continuations" :key="c.id" class="continuation-item glass">
        <span class="node" aria-hidden="true"></span>
        <p class="cont-text">{{ c.content }}</p>
        <div class="meta">
          <router-link :to="`/u/${c.username}`" class="author">
            <span class="author-dot"></span>@{{ c.username }}
          </router-link>
          <span class="tag" :class="c.is_independent ? 'tag--ind' : 'tag--lin'">
            {{ c.is_independent ? '独立续写' : '线性接力' }}
          </span>
          <span class="date">{{ c.created_at?.slice(0, 10) }}</span>
        </div>
      </article>
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

<style scoped>
.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 22px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(var(--aurora-indigo), transparent);
  opacity: 0.5;
}
.continuation-item {
  position: relative;
  padding: 18px 22px;
}
.node {
  position: absolute;
  left: -22px;
  top: 24px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--grad-aurora);
  box-shadow: 0 0 10px var(--aurora-indigo);
  transform: translateX(-4px);
}
.cont-text {
  font-family: var(--font-serif);
  font-size: 1.02rem;
  line-height: 1.85;
  color: var(--moon);
  white-space: pre-wrap;
}
.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  font-size: 0.78rem;
  color: var(--mist-dim);
}
.author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--mist);
  text-decoration: none;
}
a.author:hover {
  color: var(--aurora-teal);
}
.author-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--grad-aurora);
}
.tag {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.7rem;
  border: 1px solid var(--line);
}
.tag--lin {
  color: var(--aurora-teal);
  border-color: rgba(94, 234, 212, 0.3);
}
.tag--ind {
  color: var(--dawn);
  border-color: rgba(255, 192, 159, 0.3);
}
.date {
  margin-left: auto;
}
</style>
