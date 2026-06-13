import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../api/client';

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([]);
  const unread = ref(0);

  async function fetch() {
    try {
      const res = await apiClient.get('/notifications');
      items.value = res.data.items;
      unread.value = res.data.unread;
    } catch {
      /* 未登录或出错时静默 */
    }
  }

  async function markAllRead() {
    await apiClient.post('/notifications/read');
    unread.value = 0;
    items.value = items.value.map((n) => ({ ...n, is_read: 1 }));
  }

  function reset() {
    items.value = [];
    unread.value = 0;
  }

  return { items, unread, fetch, markAllRead, reset };
});
