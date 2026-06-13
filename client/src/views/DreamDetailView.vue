<template>
  <div class="dream-detail" v-if="dream">
    <h1>{{ dream.title || '无标题梦境' }}</h1>
    <div class="meta">
      <span>@{{ dream.username }}</span>
      <span>{{ dream.created_at?.slice(0, 10) }}</span>
      <span class="badge">{{ dream.visibility === 'public' ? '公开' : '私有' }}</span>
    </div>
    <section class="content">
      <h2>梦境内容</h2>
      <p>{{ dream.content }}</p>
    </section>
    <section v-if="dream.ai_story" class="ai-story">
      <h2>🤖 AI 续写故事</h2>
      <p>{{ dream.ai_story }}</p>
    </section>
    <div class="actions">
      <button v-if="isOwner && !dream.ai_story" @click="generateAI">🤖 AI 续写</button>
      <button v-if="dream.visibility === 'public'" @click="$router.push(`/dreams/${dream.id}/continue`)">✏️ 接力续写</button>
      <button @click="toggleFavorite">{{ isFavorited ? '❤️ 已收藏' : '🤍 收藏' }}</button>
      <button @click="$router.push(`/share/${dream.id}`)">📤 分享卡片</button>
    </div>
    <section v-if="dream.visibility === 'public'" class="continuations">
      <h2>续写接力</h2>
      <ContinuationList :dream-id="dream.id" />
    </section>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/auth';
import ContinuationList from '../components/ContinuationList.vue';

const route = useRoute();
const auth = useAuthStore();
const dream = ref(null);
const isFavorited = ref(false);
const error = ref('');

const isOwner = computed(() => dream.value?.user_id === auth.user?.id);

onMounted(async () => {
  try {
    const res = await apiClient.get(`/dreams/${route.params.id}`);
    dream.value = res.data;
    await checkFavorite();
  } catch(e) { error.value = '加载失败'; }
});

async function checkFavorite() {
  if (!auth.isLoggedIn) return;
  try {
    const res = await apiClient.get('/favorites');
    isFavorited.value = res.data.some(f => f.dream_id === dream.value.id);
  } catch { /* ignore */ }
}

async function toggleFavorite() {
  if (!auth.isLoggedIn) { error.value = '请先登录'; return; }
  try {
    if (isFavorited.value) {
      await apiClient.delete(`/favorites/${dream.value.id}`);
    } else {
      await apiClient.post('/favorites', { dream_id: dream.value.id });
    }
    isFavorited.value = !isFavorited.value;
  } catch(e) { error.value = e.response?.data?.error || '操作失败'; }
}

async function generateAI() {
  error.value = '';
  try {
    const res = await apiClient.post(`/dreams/${dream.value.id}/generate`);
    dream.value.ai_story = res.data.ai_story;
  } catch(e) { error.value = 'AI 生成失败'; }
}
</script>
