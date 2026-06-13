<template>
  <div class="favorites"><h1>我的收藏</h1>
    <DreamCard v-for="f in favStore.items" :key="f.id" :dream="f" />
    <p v-if="!favStore.items.length">还没有收藏任何梦境</p>
  </div>
</template>
<script setup>
import { onMounted } from 'vue';
import { useFavoritesStore } from '../stores/favorites';
import DreamCard from '../components/DreamCard.vue';
const favStore = useFavoritesStore();
onMounted(() => favStore.fetchFavorites());
</script>
