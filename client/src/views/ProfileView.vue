<template>
  <div class="page">
    <div v-if="profile" class="profile">
      <header class="profile-head glass">
        <div class="avatar-lg">{{ initial }}</div>
        <div class="profile-info">
          <h1>{{ profile.user.username }}</h1>
          <div class="counts">
            <span><b>{{ profile.dreamCount }}</b> 公开梦境</span>
            <span><b>{{ profile.followerCount }}</b> 关注者</span>
            <span><b>{{ profile.followingCount }}</b> 关注中</span>
          </div>
        </div>
        <div class="profile-actions">
          <button
            v-if="auth.isLoggedIn && !profile.isSelf"
            :class="following ? 'btn-ghost' : 'btn'"
            :disabled="busy"
            @click="toggleFollow"
          >
            {{ following ? '已关注' : '+ 关注' }}
          </button>
          <router-link v-else-if="profile.isSelf" to="/mine" class="btn-ghost btn">管理我的梦境</router-link>
        </div>
      </header>

      <h2 class="dreams-title">公开的梦</h2>
      <div v-if="profile.dreams.length" class="grid stagger">
        <DreamCard v-for="d in profile.dreams" :key="d.id" :dream="d" />
      </div>
      <p v-else class="empty-state">TA 还没有公开任何梦境。</p>
    </div>

    <div v-else-if="notFound" class="empty-state">没有找到这位做梦者。</div>
    <div v-else class="loading-state"><span class="spinner"></span><span>加载中…</span></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/auth';
import DreamCard from '../components/DreamCard.vue';

const route = useRoute();
const auth = useAuthStore();
const profile = ref(null);
const notFound = ref(false);
const following = ref(false);
const busy = ref(false);

const initial = computed(() => (profile.value?.user.username || '?').slice(0, 1).toUpperCase());

async function load() {
  profile.value = null;
  notFound.value = false;
  try {
    const res = await apiClient.get(`/users/${route.params.username}`);
    profile.value = res.data;
    following.value = res.data.isFollowing;
  } catch (e) {
    if (e.response?.status === 404) notFound.value = true;
  }
}

async function toggleFollow() {
  busy.value = true;
  try {
    const res = following.value
      ? await apiClient.delete(`/users/${route.params.username}/follow`)
      : await apiClient.post(`/users/${route.params.username}/follow`);
    following.value = res.data.following;
    if (profile.value) profile.value.followerCount = res.data.followerCount;
  } finally {
    busy.value = false;
  }
}

onMounted(load);
watch(() => route.params.username, load);
</script>

<style scoped>
.profile {
  animation: rise 0.6s var(--ease) both;
}
.profile-head {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 28px 30px;
  margin-bottom: 30px;
}
.avatar-lg {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 50%;
  font-family: var(--font-display);
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--ink-on-light);
  background: var(--grad-aurora);
  box-shadow: var(--glow-indigo);
}
.profile-info {
  flex: 1;
}
.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 10px;
  font-size: 0.88rem;
  color: var(--mist-dim);
}
.counts b {
  color: var(--moon);
  font-weight: 700;
}
.profile-actions {
  flex-shrink: 0;
}
.dreams-title {
  margin-bottom: 20px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 20px;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 90px 20px;
  color: var(--mist-dim);
  font-family: var(--font-serif);
  font-style: italic;
}
@media (max-width: 600px) {
  .profile-head {
    flex-direction: column;
    text-align: center;
  }
  .counts {
    justify-content: center;
  }
}
</style>
