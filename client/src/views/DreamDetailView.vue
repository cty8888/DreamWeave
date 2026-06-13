<template>
  <div class="page page--narrow">
    <div v-if="dream" class="detail">
      <header class="detail-head">
        <div class="detail-meta">
          <router-link :to="`/u/${dream.username}`" class="author">
            <span class="author-dot"></span>@{{ dream.username }}
          </router-link>
          <span class="sep">·</span>
          <span>{{ dream.created_at?.slice(0, 10) }}</span>
          <span class="badge" :class="dream.visibility === 'public' ? 'badge--pub' : ''">
            {{ dream.visibility === 'public' ? '公开' : '私有' }}
          </span>
        </div>
        <h1>{{ dream.title || '无题之梦' }}</h1>

        <div v-if="scenes.length || emotions.length" class="tag-row">
          <span v-for="s in scenes" :key="'s' + s" class="chip chip--scene">{{ s }}</span>
          <span v-for="e in emotions" :key="'e' + e.name" class="chip chip--emotion">
            {{ e.name }}
            <span class="intensity">
              <i v-for="n in 5" :key="n" :class="{ on: n <= (e.intensity || 3) }"></i>
            </span>
          </span>
        </div>
      </header>

      <section class="reading glass">
        <div class="reading-head">
          <p class="block-label">梦境原文 · {{ wordCount }} 字</p>
          <button v-if="speech.supported" class="speak-btn" :class="{ on: speech.speakingId.value === 'content' }" @click="speech.toggle('content', dream.content)">
            {{ speech.speakingId.value === 'content' ? '◼ 停止' : '🔊 朗读' }}
          </button>
        </div>
        <p class="prose">{{ dream.content }}</p>
      </section>

      <section v-if="dream.ai_story" v-reveal class="reading reading--ai glass">
        <div class="reading-head">
          <p class="block-label block-label--ai">✦ AI 续写的故事</p>
          <button v-if="speech.supported" class="speak-btn" :class="{ on: speech.speakingId.value === 'story' }" @click="speech.toggle('story', dream.ai_story)">
            {{ speech.speakingId.value === 'story' ? '◼ 停止' : '🔊 朗读' }}
          </button>
        </div>
        <p class="prose prose--story">{{ dream.ai_story }}</p>
      </section>

      <section v-if="dream.interpretation" v-reveal class="reading reading--interp glass">
        <div class="reading-head">
          <p class="block-label block-label--interp">🌙 AI 解梦</p>
          <button v-if="speech.supported" class="speak-btn" :class="{ on: speech.speakingId.value === 'interp' }" @click="speech.toggle('interp', dream.interpretation)">
            {{ speech.speakingId.value === 'interp' ? '◼ 停止' : '🔊 朗读' }}
          </button>
        </div>
        <p class="prose prose--interp">{{ dream.interpretation }}</p>
      </section>

      <!-- AI 续写风格选择（仅作者、尚未续写时） -->
      <div v-if="isOwner && !dream.ai_story" class="style-picker glass">
        <span class="style-label">续写风格</span>
        <div class="style-chips">
          <button
            v-for="s in styles"
            :key="s.key"
            class="style-chip"
            :class="{ active: selectedStyle === s.key }"
            @click="selectedStyle = s.key"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <div class="actions">
        <button v-if="isOwner && !dream.ai_story" class="btn-dawn" :disabled="generating" @click="generateAI">
          <span v-if="generating" class="spinner"></span>
          {{ generating ? '正在续写…' : '✦ 让 AI 续写' }}
        </button>
        <button v-if="isOwner && !dream.interpretation" class="btn-ghost" :disabled="interpreting" @click="interpret">
          <span v-if="interpreting" class="spinner"></span>
          {{ interpreting ? '解析中…' : '🌙 AI 解梦' }}
        </button>
        <button
          v-if="dream.visibility === 'public'"
          class="btn-ghost"
          :class="{ liked }"
          :disabled="!auth.isLoggedIn"
          @click="toggleLike"
        >
          {{ liked ? '♥' : '♡' }} {{ likeCount }}
        </button>
        <button
          v-if="auth.isLoggedIn && dream.visibility === 'public'"
          class="btn-ghost"
          @click="$router.push(`/dreams/${dream.id}/continue`)"
        >
          ✏️ 接力续写
        </button>
        <button v-if="auth.isLoggedIn" class="btn-ghost" :class="{ faved: isFavorited }" @click="toggleFavorite">
          {{ isFavorited ? '❤ 已收藏' : '♡ 收藏' }}
        </button>
        <button class="btn-ghost" @click="$router.push(`/share/${dream.id}`)">📤 分享卡片</button>
        <button v-if="isOwner" class="btn-ghost" @click="$router.push(`/dreams/${dream.id}/edit`)">✎ 编辑</button>
        <button v-if="isOwner" class="btn-ghost danger" @click="removeDream">🗑 删除</button>
        <router-link v-if="!auth.isLoggedIn" to="/login" class="btn btn-sm login-hint">
          登录后可续写 / 点赞 / 评论
        </router-link>
      </div>

      <section v-if="dream.visibility === 'public'" class="continuations">
        <h2>续写接力</h2>
        <ContinuationList :dream-id="dream.id" />
      </section>

      <!-- 评论 -->
      <section v-if="dream.visibility === 'public'" class="comments">
        <h2>评论 <span class="cnt">{{ comments.length }}</span></h2>

        <form v-if="auth.isLoggedIn" class="comment-form" @submit.prevent="postComment">
          <input v-model="newComment" placeholder="说点什么…" />
          <button class="btn-sm" :disabled="!newComment.trim() || posting">发表</button>
        </form>
        <p v-else class="comment-login">
          <router-link to="/login">登录</router-link> 后参与讨论
        </p>

        <div v-if="comments.length" class="comment-list stagger">
          <div v-for="c in comments" :key="c.id" class="comment glass">
            <div class="comment-top">
              <router-link :to="`/u/${c.username}`" class="author">
                <span class="author-dot"></span>@{{ c.username }}
              </router-link>
              <span class="date">{{ c.created_at?.slice(0, 16).replace('T', ' ') }}</span>
            </div>
            <p class="comment-text">{{ c.content }}</p>
          </div>
        </div>
        <p v-else class="empty-state">还没有评论，来抢沙发。</p>
      </section>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div v-else class="loading-state">
      <span class="spinner"></span>
      <span>正在唤醒这个梦……</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/auth';
import ContinuationList from '../components/ContinuationList.vue';
import { useSpeech } from '../composables/useSpeech';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const speech = useSpeech();
const dream = ref(null);
const isFavorited = ref(false);
const error = ref('');
const generating = ref(false);
const interpreting = ref(false);

const likeCount = ref(0);
const liked = ref(false);
const comments = ref([]);
const newComment = ref('');
const posting = ref(false);

const isOwner = computed(() => dream.value?.user_id === auth.user?.id);

function parseJson(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}
const scenes = computed(() =>
  parseJson(dream.value?.scene_ids).map((s) => (typeof s === 'object' ? s.name : s)).filter(Boolean)
);
const emotions = computed(() =>
  parseJson(dream.value?.emotion_tags).filter((e) => e && e.name)
);
const wordCount = computed(() => (dream.value?.content || '').replace(/\s/g, '').length);

const styles = [
  { key: '', label: '自然' },
  { key: 'healing', label: '治愈' },
  { key: 'suspense', label: '悬疑' },
  { key: 'poetic', label: '诗意' },
  { key: 'absurd', label: '荒诞' },
];
const selectedStyle = ref('');

onMounted(async () => {
  try {
    const res = await apiClient.get(`/dreams/${route.params.id}`);
    dream.value = res.data;
    await checkFavorite();
    if (dream.value.visibility === 'public') {
      await Promise.all([loadLikes(), loadComments()]);
    }
  } catch (e) {
    error.value = '加载失败';
  }
});

async function checkFavorite() {
  if (!auth.isLoggedIn) return;
  try {
    const res = await apiClient.get('/favorites');
    isFavorited.value = res.data.some((f) => f.dream_id === dream.value.id);
  } catch {
    /* ignore */
  }
}

async function toggleFavorite() {
  try {
    if (isFavorited.value) await apiClient.delete(`/favorites/${dream.value.id}`);
    else await apiClient.post('/favorites', { dream_id: dream.value.id });
    isFavorited.value = !isFavorited.value;
  } catch (e) {
    error.value = e.response?.data?.error || '操作失败';
  }
}

async function generateAI() {
  error.value = '';
  generating.value = true;
  try {
    const res = await apiClient.post(`/dreams/${dream.value.id}/generate`, {
      style: selectedStyle.value || undefined,
    });
    dream.value.ai_story = res.data.ai_story;
  } catch (e) {
    error.value = 'AI 生成失败';
  } finally {
    generating.value = false;
  }
}

async function removeDream() {
  if (!confirm('确定要删除这个梦吗？此操作不可恢复。')) return;
  try {
    await apiClient.delete(`/dreams/${dream.value.id}`);
    router.push('/mine');
  } catch (e) {
    error.value = e.response?.data?.error || '删除失败';
  }
}

async function interpret() {
  error.value = '';
  interpreting.value = true;
  try {
    const res = await apiClient.post(`/dreams/${dream.value.id}/interpret`);
    dream.value.interpretation = res.data.interpretation;
  } catch (e) {
    error.value = 'AI 解梦失败';
  } finally {
    interpreting.value = false;
  }
}

async function loadLikes() {
  try {
    const res = await apiClient.get(`/dreams/${dream.value.id}/likes`);
    likeCount.value = res.data.count;
    liked.value = res.data.liked;
  } catch {
    /* ignore */
  }
}

async function toggleLike() {
  if (!auth.isLoggedIn) return;
  try {
    const res = liked.value
      ? await apiClient.delete(`/dreams/${dream.value.id}/likes`)
      : await apiClient.post(`/dreams/${dream.value.id}/likes`);
    likeCount.value = res.data.count;
    liked.value = res.data.liked;
  } catch (e) {
    error.value = '操作失败';
  }
}

async function loadComments() {
  try {
    const res = await apiClient.get(`/dreams/${dream.value.id}/comments`);
    comments.value = res.data;
  } catch {
    /* ignore */
  }
}

async function postComment() {
  if (!newComment.value.trim()) return;
  posting.value = true;
  try {
    const res = await apiClient.post(`/dreams/${dream.value.id}/comments`, {
      content: newComment.value,
    });
    comments.value.push(res.data);
    newComment.value = '';
  } catch (e) {
    error.value = e.response?.data?.error || '评论失败';
  } finally {
    posting.value = false;
  }
}
</script>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 22px;
  animation: rise 0.6s var(--ease) both;
}
.detail-head {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--mist-dim);
}
.author {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--mist);
  text-decoration: none;
  transition: color 0.2s;
}
a.author:hover {
  color: var(--aurora-teal);
}

/* 续写风格选择器 */
.style-picker {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 14px 20px;
}
.style-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--mist-dim);
}
.style-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.style-chip {
  font-size: 0.82rem;
  padding: 6px 14px;
  border-radius: 999px;
  color: var(--mist);
  background: rgba(60, 68, 120, 0.22);
  border: 1px solid var(--line);
  box-shadow: none;
}
.style-chip:hover:not(.active) {
  transform: none;
  box-shadow: none;
  color: var(--dawn);
  border-color: rgba(255, 192, 159, 0.4);
}
.style-chip.active {
  color: #2a1206;
  background: linear-gradient(120deg, var(--dawn), var(--dawn-deep));
  border-color: transparent;
}
.actions .danger:hover:not(:disabled) {
  color: #ff9bb0;
  border-color: rgba(255, 90, 120, 0.45);
  background: rgba(255, 90, 120, 0.08);
}
.author-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--grad-aurora);
  box-shadow: 0 0 8px var(--aurora-indigo);
}
.sep {
  color: var(--line-hi);
}
.badge--pub {
  color: var(--aurora-teal);
  border-color: rgba(94, 234, 212, 0.35);
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.chip--emotion .intensity {
  display: inline-flex;
  gap: 2px;
  margin-left: 5px;
}
.chip--emotion .intensity i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 192, 159, 0.25);
}
.chip--emotion .intensity i.on {
  background: var(--dawn);
  box-shadow: 0 0 4px var(--dawn);
}

.reading {
  padding: 30px 34px;
}
.reading-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.reading-head .block-label {
  margin-bottom: 0;
}
.speak-btn {
  flex-shrink: 0;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 5px 13px;
  border-radius: 999px;
  color: var(--mist);
  background: var(--surface-hi);
  border: 1px solid var(--line);
  box-shadow: none;
}
.speak-btn:hover:not(:disabled) {
  transform: none;
  box-shadow: none;
  color: var(--aurora-teal);
  border-color: rgba(94, 234, 212, 0.4);
}
.speak-btn.on {
  color: var(--aurora-teal);
  border-color: var(--glow-ring);
  background: rgba(94, 234, 212, 0.1);
}
.reading--ai {
  background: radial-gradient(600px 200px at 100% 0%, rgba(255, 192, 159, 0.1), transparent 70%), var(--surface);
  border-color: rgba(255, 192, 159, 0.22);
}
.reading--interp {
  background: radial-gradient(600px 200px at 100% 0%, rgba(129, 140, 248, 0.12), transparent 70%), var(--surface);
  border-color: rgba(129, 140, 248, 0.28);
}
.block-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--mist-dim);
  margin-bottom: 16px;
}
.block-label--ai {
  color: var(--dawn);
}
.block-label--interp {
  color: var(--aurora-violet);
}
.prose {
  font-family: var(--font-serif);
  font-size: 1.12rem;
  line-height: 2;
  color: var(--moon);
  white-space: pre-wrap;
}
.prose--story {
  color: #f5efe8;
}
/* AI 故事首字下沉，杂志级文学排版 */
.prose--story::first-letter {
  float: left;
  font-family: var(--font-display);
  font-size: 3.4rem;
  line-height: 0.82;
  font-weight: 600;
  padding: 6px 12px 2px 0;
  background: var(--grad-dawn);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.prose--interp {
  color: #e9e7ff;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 6px 0;
}
.actions .faved {
  color: #ff9bb0;
  border-color: rgba(255, 90, 120, 0.4);
}
.actions .liked {
  color: #ff9bb0;
  border-color: rgba(255, 90, 120, 0.45);
  background: rgba(255, 90, 120, 0.1);
}
.login-hint {
  text-decoration: none;
  padding: 12px 22px;
}

.continuations,
.comments {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.comments h2 .cnt {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--aurora-teal);
  margin-left: 6px;
}
.comment-form {
  display: flex;
  gap: 10px;
}
.comment-form input {
  flex: 1;
}
.comment-form button {
  flex-shrink: 0;
}
.comment-login {
  color: var(--mist-dim);
  font-size: 0.9rem;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.comment {
  padding: 16px 20px;
}
.comment-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--mist-dim);
  margin-bottom: 8px;
}
.comment-text {
  color: var(--moon);
  line-height: 1.7;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 100px 20px;
  color: var(--mist-dim);
  font-family: var(--font-serif);
  font-style: italic;
}
.loading-state .spinner {
  width: 26px;
  height: 26px;
  border-width: 2px;
}
.btn-sm {
  padding: 8px 18px;
  font-size: 0.88rem;
}
</style>
