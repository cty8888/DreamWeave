<template>
  <div class="mine"><h1>我的梦境</h1>
    <div class="tabs">
      <button :class="{active:tab==='all'}" @click="tab='all'">全部</button>
      <button :class="{active:tab==='private'}" @click="tab='private'">私有</button>
      <button :class="{active:tab==='public'}" @click="tab='public'">公开</button>
    </div>
    <DreamCard v-for="d in filtered" :key="d.id" :dream="d" />
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '../api/client';
import DreamCard from '../components/DreamCard.vue';
const dreams=ref([]), tab=ref('all');
onMounted(async()=>{const r=await apiClient.get('/dreams',{params:{page:1,limit:50}});dreams.value=r.data.data;});
const filtered=computed(()=>tab.value==='all'?dreams.value:dreams.value.filter(d=>d.visibility===tab.value));
</script>
