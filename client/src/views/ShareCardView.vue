<template>
  <div class="share-page" v-if="dream">
    <ShareCard :dream="dream" />
    <button @click="exportPNG">📥 导出 PNG</button>
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
onMounted(async () => { const res = await apiClient.get(`/dreams/${route.params.id}`); dream.value = res.data; });
async function exportPNG() {
  const el = document.querySelector('.share-card');
  const canvas = await html2canvas(el, { backgroundColor: null });
  const link = document.createElement('a');
  link.download = `dream-${dream.value.id}.png`;
  link.href = canvas.toDataURL();
  link.click();
}
</script>
