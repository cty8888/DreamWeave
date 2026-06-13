<template>
  <div class="dream-form">
    <h1>记录梦境</h1>
    <form @submit.prevent="handleSubmit">
      <input v-model="title" placeholder="梦境标题（可选）" class="input" />
      <textarea v-model="content" placeholder="描述你的梦..." rows="8" required class="textarea"></textarea>
      <SceneSelector v-model="sceneIds" />
      <EmotionSelector v-model="emotionTags" />
      <div class="visibility-toggle">
        <label><input type="radio" v-model="visibility" value="private" /> 私有（AI 续写）</label>
        <label><input type="radio" v-model="visibility" value="public" /> 公开（他人可接力）</label>
      </div>
      <button type="submit" :disabled="loading">保存梦境</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../api/client';
import SceneSelector from '../components/SceneSelector.vue';
import EmotionSelector from '../components/EmotionSelector.vue';

const router = useRouter();
const title = ref('');
const content = ref('');
const sceneIds = ref([]);
const emotionTags = ref([]);
const visibility = ref('private');
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  if (!content.value.trim()) return;
  error.value = '';
  loading.value = true;
  try {
    const res = await apiClient.post('/dreams', {
      title: title.value,
      content: content.value,
      scene_ids: sceneIds.value.map(s => s.id || s.name),
      emotion_tags: emotionTags.value,
      visibility: visibility.value,
    });
    router.push(`/dreams/${res.data.id}`);
  } catch (e) {
    error.value = e.response?.data?.error || '保存失败';
  } finally { loading.value = false; }
}
</script>
