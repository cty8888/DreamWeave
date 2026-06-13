<template>
  <nav>
    <router-link to="/">🏠 广场</router-link>
    <router-link to="/dreams/new">✏️ 记录</router-link>
    <router-link to="/fragments/weave">🧩 串联</router-link>
    <router-link v-if="auth.isLoggedIn" to="/mine">📖 我的</router-link>
    <router-link v-if="auth.isLoggedIn" to="/favorites">❤️ 收藏</router-link>
    <template v-if="auth.isLoggedIn">
      <span>{{ auth.user?.username }}</span>
      <button @click="logout">退出</button>
    </template>
    <router-link v-else to="/login">登录</router-link>
  </nav>
</template>
<script setup>
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
const auth = useAuthStore();
const router = useRouter();
function logout() { auth.logout(); router.push('/'); }
</script>
