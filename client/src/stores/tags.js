import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../api/client';

export const useTagsStore = defineStore('tags', () => {
  const scenes = ref([]);
  const emotions = ref([]);
  const loaded = ref(false);

  async function fetchTags() {
    if (loaded.value) return;
    const [sRes, eRes] = await Promise.all([
      apiClient.get('/tags/scenes'),
      apiClient.get('/tags/emotions'),
    ]);
    scenes.value = sRes.data;
    emotions.value = eRes.data;
    loaded.value = true;
  }

  return { scenes, emotions, loaded, fetchTags };
});
