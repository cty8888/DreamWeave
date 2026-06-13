<template>
  <div class="page page--narrow share-page">
    <div class="section-head" style="text-align: center; align-items: center">
      <p class="eyebrow">把梦带走</p>
      <h1>分享卡片</h1>
    </div>

    <div v-if="dream" class="share-stage">
      <ShareCard :dream="dream" />
      <button class="btn-dawn" @click="exportPNG">
        <span v-if="exporting" class="spinner"></span>
        {{ exporting ? '生成中…' : '📥 导出为 PNG' }}
      </button>
    </div>
    <div v-else class="loading-state">
      <span class="spinner"></span><span>正在准备卡片……</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import html2canvas from 'html2canvas';
import apiClient from '../api/client';
import ShareCard from '../components/ShareCard.vue';
const route = useRoute();
const dream = ref(null);
const exporting = ref(false);
onMounted(async () => {
  const res = await apiClient.get(`/dreams/${route.params.id}`);
  dream.value = res.data;
});
async function exportPNG() {
  exporting.value = true;
  try {
    const el = document.querySelector('.share-card');
    const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
    const link = document.createElement('a');
    link.download = `dream-${dream.value.id}.png`;
    link.href = canvas.toDataURL();
    link.click();
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.share-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 16px 0 40px;
  animation: rise 0.6s var(--ease) both;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 80px 20px;
  color: var(--mist-dim);
  font-family: var(--font-serif);
  font-style: italic;
}
</style>
