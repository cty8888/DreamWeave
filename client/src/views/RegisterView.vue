<template>
  <div class="auth-page">
    <h1>注册</h1>
    <form @submit.prevent="handleSubmit">
      <input v-model="username" type="text" placeholder="用户名" required />
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码（至少6位）" required minlength="6" />
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">注册</button>
    </form>
    <p>已有账号？<router-link to="/login">去登录</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const auth = useAuthStore();

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register(username.value, email.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || '注册失败';
  } finally { loading.value = false; }
}
</script>
