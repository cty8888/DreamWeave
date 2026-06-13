<template>
  <div class="page">
    <div class="section-head">
      <p class="eyebrow">珍藏的梦</p>
      <h1>我的收藏</h1>
    </div>

    <div v-if="favStore.items.length" class="grid stagger">
      <DreamCard v-for="f in favStore.items" :key="f.id" :dream="f" />
    </div>
    <p v-else class="empty-state">还没有收藏任何梦境，去广场寻找打动你的故事吧。</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useFavoritesStore } from '../stores/favorites';
import DreamCard from '../components/DreamCard.vue';
const favStore = useFavoritesStore();
onMounted(() => favStore.fetchFavorites());
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 20px;
}
</style>
