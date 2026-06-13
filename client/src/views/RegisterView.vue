<template>
  <div class="auth-page">
    <span class="auth-orb" aria-hidden="true"></span>
    <div class="auth-card glass">
      <p class="eyebrow">加入 DreamWeave</p>
      <h1>编织你的第一个梦</h1>
      <p class="auth-hint">注册后，每个梦都能成为故事。</p>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="field">
          <label>账号</label>
          <input v-model="username" type="text" placeholder="你的用户名" required autocomplete="username" />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="至少 6 位" required minlength="6" autocomplete="new-password" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? '创建中…' : '注册' }}
        </button>
      </form>

      <p class="auth-switch">已有账号？<router-link to="/login">去登录 →</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const auth = useAuthStore();

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register(username.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: calc(100svh - 120px);
  display: grid;
  place-items: center;
  padding: 40px 20px;
}
.auth-orb {
  position: absolute;
  top: 16%;
  left: 50%;
  width: 340px;
  height: 340px;
  margin-left: -170px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 192, 159, 0.28), rgba(192, 132, 252, 0.1) 45%, transparent 70%);
  filter: blur(24px);
  pointer-events: none;
  animation: orb-breathe 8s var(--ease) infinite;
}
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.18); opacity: 1; }
}
.auth-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 44px 38px;
  text-align: center;
  animation: rise 0.6s var(--ease) both;
}
.auth-hint {
  color: var(--mist);
  margin: 14px 0 28px;
  font-family: var(--font-serif);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}
.auth-form button {
  margin-top: 6px;
}
.auth-switch {
  margin-top: 24px;
  font-size: 0.9rem;
  color: var(--mist-dim);
}
</style>
