<template>
  <div class="page page--narrow">
    <div class="section-head">
      <p class="eyebrow">接住别人的梦</p>
      <h1>接力续写</h1>
      <p v-if="dream" class="sub">
        续写 @{{ dream.username }} 的梦境「{{ dream.title || '无题之梦' }}」
      </p>
    </div>

    <div class="continue-card glass">
      <label>续写方式</label>
      <div class="mode-toggle">
        <label class="mode-opt" :class="{ active: mode === 'linear' }">
          <input type="radio" v-model="mode" value="linear" />
          <span class="mode-name">线性接力</span>
          <span class="mode-desc">接在最新一段之后，延续同一条故事线</span>
        </label>
        <label class="mode-opt" :class="{ active: mode === 'independent' }">
          <input type="radio" v-model="mode" value="independent" />
          <span class="mode-name">独立续写</span>
          <span class="mode-desc">基于原始梦境，开辟属于你的全新版本</span>
        </label>
      </div>

      <div class="field">
        <label>你的续写</label>
        <textarea v-model="content" placeholder="于是，故事在这里拐了个弯……" rows="9" required></textarea>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <button @click="submit" :disabled="loading || !content.trim()">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? '提交中…' : '提交续写' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api/client';
const route = useRoute(),
  router = useRouter();
const dream = ref(null),
  content = ref(''),
  mode = ref('linear'),
  loading = ref(false),
  error = ref('');
onMounted(async () => {
  const r = await apiClient.get(`/dreams/${route.params.id}`);
  dream.value = r.data;
});
async function submit() {
  if (!content.value.trim()) return;
  loading.value = true;
  error.value = '';
  try {
    const conts = await apiClient.get(`/dreams/${route.params.id}/continuations`);
    const linear = conts.data.filter((c) => !c.is_independent);
    const last = linear[linear.length - 1] || null;
    await apiClient.post(`/dreams/${route.params.id}/continuations`, {
      content: content.value,
      parent_id: mode.value === 'linear' ? last?.id : null,
      is_independent: mode.value === 'independent',
    });
    router.push(`/dreams/${route.params.id}`);
  } catch (e) {
    error.value = e.response?.data?.error || '提交失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.sub {
  font-family: var(--font-serif);
  color: var(--mist);
  font-size: 1rem;
}
.continue-card {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 32px;
}
.continue-card > button {
  align-self: flex-start;
}
.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.mode-opt {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: rgba(10, 12, 26, 0.45);
  cursor: pointer;
  margin: 0;
  transition: border-color 0.3s var(--ease), background 0.3s var(--ease),
    transform 0.3s var(--ease);
}
.mode-opt input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.mode-opt:hover {
  transform: translateY(-2px);
  border-color: var(--line-hi);
}
.mode-opt.active {
  border-color: var(--glow-ring);
  background: rgba(129, 140, 248, 0.12);
  box-shadow: var(--glow-indigo);
}
.mode-name {
  font-family: var(--font-display);
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--moon);
}
.mode-desc {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--mist-dim);
}
@media (max-width: 560px) {
  .mode-toggle {
    grid-template-columns: 1fr;
  }
}
</style>
