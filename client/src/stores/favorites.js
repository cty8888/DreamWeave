import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../api/client';

export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref([]);

  async function fetchFavorites() {
    const res = await apiClient.get('/favorites');
    items.value = res.data;
  }

  async function toggle(dreamId) {
    const idx = items.value.findIndex(f => f.dream_id === dreamId);
    if (idx >= 0) { await apiClient.delete(`/favorites/${dreamId}`); items.value.splice(idx, 1); }
    else { await apiClient.post('/favorites', { dream_id: dreamId }); await fetchFavorites(); }
  }

  return { items, fetchFavorites, toggle };
});
