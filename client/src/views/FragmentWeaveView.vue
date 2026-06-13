<template>
  <div class="page page--narrow">
    <div class="section-head">
      <p class="eyebrow">把零散的梦缝合起来</p>
      <h1>碎片串联</h1>
      <p class="sub">上传多个零散的梦境碎片，AI 将它们编织成一个连贯的故事。</p>
    </div>

    <div class="weave-card glass">
      <FragmentEditor v-model="fragments" />
      <button class="btn-dawn" @click="weave" :disabled="loading || fragments.length < 2">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? '编织中…' : '✦ 开始编织' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <section v-if="story" class="result reading--ai glass">
      <p class="block-label">编织结果</p>
      <p class="prose">{{ story }}</p>
    </section>

    <section v-if="sessions.length" class="history">
      <h2>历史编织</h2>
      <div class="hist-list">
        <button
          v-for="s in sessions"
          :key="s.session_id"
          class="hist-item glass"
          @click="$router.push(`/fragments/${s.session_id}`)"
        >
          <span class="hist-icon">🧩</span>
          <span class="hist-count">{{ s.fragment_count }} 个碎片</span>
          <span class="hist-date">{{ s.created_at?.slice(0, 10) }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/client';
import FragmentEditor from '../components/FragmentEditor.vue';
const fragments = ref([{ content: '' }, { content: '' }]),
  story = ref(''),
  error = ref(''),
  loading = ref(false),
  sessions = ref([]);
onMounted(async () => {
  try {
    const r = await apiClient.get('/fragments/sessions');
    sessions.value = r.data;
  } catch {}
});
async function weave() {
  error.value = '';
  loading.value = true;
  try {
    const r = await apiClient.post('/fragments/weave', { fragments: fragments.value });
    story.value = r.data.story;
  } catch (e) {
    error.value = e.response?.data?.error || '编织失败';
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
.weave-card {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 30px 32px;
}
.weave-card > button {
  align-self: flex-start;
}

.result {
  margin-top: 24px;
  padding: 30px 34px;
  background:
    radial-gradient(600px 200px at 100% 0%, rgba(255, 192, 159, 0.1), transparent 70%),
    var(--surface);
  border-color: rgba(255, 192, 159, 0.22);
  animation: rise 0.6s var(--ease) both;
}
.block-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--dawn);
  margin-bottom: 16px;
}
.prose {
  font-family: var(--font-serif);
  font-size: 1.12rem;
  line-height: 2;
  color: #f5efe8;
  white-space: pre-wrap;
}

.history {
  margin-top: 40px;
}
.history h2 {
  margin-bottom: 18px;
}
.hist-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
.hist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  color: var(--mist);
  background: var(--surface);
  font-size: 0.88rem;
  box-shadow: var(--shadow-card);
  transition: transform 0.3s var(--ease), border-color 0.3s var(--ease);
}
.hist-item:hover {
  transform: translateY(-3px);
  border-color: var(--line-hi);
}
.hist-icon {
  font-size: 1.1rem;
}
.hist-date {
  margin-left: auto;
  color: var(--mist-dim);
  font-size: 0.78rem;
}
</style>
