<template>
  <div class="home">
    <h1>梦境广场</h1>
    <div class="dream-grid">
      <DreamCard v-for="d in dreams" :key="d.id" :dream="d" />
    </div>
    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @click="page--">上一页</button>
      <span>{{ page }}/{{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiClient from '../api/client';
import DreamCard from '../components/DreamCard.vue';

const dreams = ref([]);
const page = ref(1);
const totalPages = ref(1);

async function fetch() {
  const r = await apiClient.get('/dreams', {
    params: { visibility: 'public', page: page.value, limit: 12 }
  });
  dreams.value = r.data.data;
  totalPages.value = Math.ceil(r.data.total / 12);
}

onMounted(fetch);
watch(page, fetch);
</script>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}
.dream-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}
</style>
