import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = ref(localStorage.getItem('token') || '');
  const isLoggedIn = computed(() => !!token.value);

  async function login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', token.value);
    localStorage.setItem('user', JSON.stringify(user.value));
    return res.data;
  }

  async function register(username, email, password) {
    const res = await apiClient.post('/auth/register', { username, email, password });
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', token.value);
    localStorage.setItem('user', JSON.stringify(user.value));
    return res.data;
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { user, token, isLoggedIn, login, register, logout };
});
